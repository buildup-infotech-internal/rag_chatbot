"""Unit/API tests for the FastAPI layer; external services and DB are mocked."""

import unittest
import uuid
import logging
import hashlib
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import get_db
from app.main import app
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.models.document_metadata import Document
from app.models.feedback import Feedback
from app.services.ingestion_service import ingest_pdf
from app.services.retrieval_service import retrieve_relevant_chunks


class FakeQuery:
    """Minimal query object for service tests without a live PostgreSQL server."""

    def __init__(self, results=None):
        self.results = list(results or [])
        self.c = SimpleNamespace(session_id=MagicMock(), last_activity_at=MagicMock())

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def join(self, *args, **kwargs):
        return self

    def outerjoin(self, *args, **kwargs):
        return self

    def group_by(self, *args, **kwargs):
        return self

    def offset(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def with_entities(self, *args, **kwargs):
        return self

    def with_for_update(self, *args, **kwargs):
        return self

    def all(self):
        return self.results

    def first(self):
        return self.results[0] if self.results else None

    def one_or_none(self):
        return self.results[0] if self.results else None

    def count(self):
        return len(self.results)

    def scalar(self):
        return len(self.results)

    def subquery(self):
        return self


class FakeDB:
    """In-memory session double that stages writes until commit."""

    def __init__(self, *, sessions=None, messages=None, feedback=None, documents=None):
        self.sessions = {item.session_id: item for item in (sessions or [])}
        self.messages = {item.id: item for item in (messages or [])}
        self.feedback_rows = list(feedback or [])
        self.documents = {item.id: item for item in (documents or [])}
        self.pending = []
        self.deleted = []
        self.fail_commit = False
        self.query_results = {}
        self.query_results_queue = []
        self.commit_count = 0
        self.rollback_count = 0

    def get(self, model, key):
        table = {
            ChatSession: self.sessions,
            ChatMessage: self.messages,
            Document: self.documents,
        }.get(model, {})
        return table.get(key)

    def query(self, model, *entities):
        if self.query_results_queue:
            return FakeQuery(self.query_results_queue.pop(0))
        default_results = {
            ChatMessage: list(self.messages.values()),
            Feedback: self.feedback_rows,
            Document: list(self.documents.values()),
        }
        return FakeQuery(self.query_results.get(model, default_results.get(model, [])))

    def add(self, item):
        self.pending.append(item)

    def commit(self):
        if self.fail_commit:
            raise SQLAlchemyError("private database details")
        self.commit_count += 1
        for item in self.pending:
            if isinstance(item, ChatSession):
                self.sessions[item.session_id] = item
            elif isinstance(item, ChatMessage):
                if item.id is None:
                    item.id = max(self.messages.keys(), default=0) + 1
                self.messages[item.id] = item
            elif isinstance(item, Feedback):
                if item.id is None:
                    item.id = max((row.id for row in self.feedback_rows), default=0) + 1
                self.feedback_rows.append(item)
        self.pending.clear()
        for item in self.deleted:
            if isinstance(item, Document):
                self.documents.pop(item.id, None)
        self.deleted.clear()

    def rollback(self):
        self.rollback_count += 1
        self.pending.clear()

    def delete(self, item):
        self.deleted.append(item)


class IngestionFakeSession:
    """Database double dedicated to the existing PDF ingestion service."""

    def __init__(self, existing=None):
        self.existing = existing
        self.pending = []
        self.commit_count = 0
        self.closed = False

    def query(self, model):
        return FakeQuery([self.existing] if self.existing else [])

    def add(self, item):
        self.pending.append(item)

    def add_all(self, items):
        self.pending.extend(items)

    def flush(self):
        for item in self.pending:
            if isinstance(item, Document) and item.id is None:
                item.id = uuid.uuid4()

    def commit(self):
        self.commit_count += 1

    def rollback(self):
        self.pending.clear()

    def close(self):
        self.closed = True


class APILayerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._logging_disabled_level = logging.root.manager.disable
        logging.disable(logging.CRITICAL)

    @classmethod
    def tearDownClass(cls):
        logging.disable(cls._logging_disabled_level)

    def setUp(self):
        self.db = FakeDB()
        app.dependency_overrides[get_db] = lambda: self.db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()

    @patch("app.services.chat_service.generate_answer")
    @patch("app.services.chat_service.retrieve_relevant_chunks", return_value=[])
    def test_chat_creates_session_and_persists_both_messages(self, _retrieve, generate):
        generate.return_value = {"answer": "No relevant material.", "sources": []}
        response = self.client.post("/api/chat", json={"question": "  Hello?  "})

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["answer"], "No relevant material.")
        self.assertEqual(len(self.db.sessions), 1)
        self.assertEqual(len(self.db.messages), 2)
        self.assertEqual(
            [message.role for message in self.db.messages.values()],
            ["user", "assistant"],
        )
        self.assertEqual(next(iter(self.db.messages.values())).content, "Hello?")

    @patch("app.services.chat_service.generate_answer")
    @patch("app.services.chat_service.retrieve_relevant_chunks", return_value=[])
    def test_chat_continues_existing_session(self, _retrieve, generate):
        session_id = uuid.uuid4()
        self.db.sessions[session_id] = ChatSession(session_id=session_id)
        generate.return_value = {"answer": "Answer", "sources": []}

        response = self.client.post(
            "/api/chat",
            json={"question": "Follow-up", "session_id": str(session_id)},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["session_id"], str(session_id))
        self.assertEqual(len(self.db.sessions), 1)
        self.assertEqual(len(self.db.messages), 2)

    def test_chat_history_is_returned_chronologically(self):
        session_id = uuid.uuid4()
        self.db.sessions[session_id] = ChatSession(session_id=session_id)
        timestamp = datetime.now(timezone.utc)
        self.db.query_results[ChatMessage] = [
            ChatMessage(id=1, session_id=session_id, role="user", content="Q", created_at=timestamp, sources=None),
            ChatMessage(id=2, session_id=session_id, role="assistant", content="A", created_at=timestamp, sources=[]),
        ]
        response = self.client.get(f"/api/chat/{session_id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["role"] for item in response.json()["messages"]], ["user", "assistant"])
        self.assertIn("created_at", response.json()["messages"][0])

    def test_unknown_chat_session_returns_404(self):
        response = self.client.get(f"/api/chat/{uuid.uuid4()}")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"]["code"], "not_found")

    def test_chat_rejects_empty_question(self):
        response = self.client.post("/api/chat", json={"question": "   "})
        self.assertEqual(response.status_code, 422)

    @patch("app.services.chat_service.generate_answer", side_effect=RuntimeError("private prompt"))
    @patch("app.services.chat_service.retrieve_relevant_chunks", return_value=[])
    def test_llm_failure_does_not_persist_partial_chat(self, _retrieve, _generate):
        response = self.client.post("/api/chat", json={"question": "Question"})
        self.assertEqual(response.status_code, 502)
        self.assertEqual(self.db.commit_count, 0)
        self.assertEqual(self.db.pending, [])
        self.assertNotIn("private prompt", response.text)

    @patch("app.services.chat_service.generate_answer", return_value={"answer": "Answer", "sources": []})
    @patch("app.services.chat_service.retrieve_relevant_chunks", return_value=[])
    def test_database_failure_rolls_back_chat(self, _retrieve, _generate):
        self.db.fail_commit = True
        response = self.client.post("/api/chat", json={"question": "Question"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(self.db.rollback_count, 1)
        self.assertEqual(self.db.pending, [])
        self.assertNotIn("private database details", response.text)

    @patch("app.services.chat_service.retrieve_relevant_chunks", side_effect=RuntimeError("private query"))
    def test_retrieval_failure_returns_safe_error_without_persisting(self, _retrieve):
        response = self.client.post("/api/chat", json={"question": "Question"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(self.db.commit_count, 0)
        self.assertNotIn("private query", response.text)

    def test_staff_session_listing_includes_creation_and_activity(self):
        session_id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        activity_at = created_at
        row = SimpleNamespace(
            session_id=session_id,
            created_at=created_at,
            last_activity_at=activity_at,
        )
        self.db.query_results_queue = [[], [object()], [row]]

        response = self.client.get("/api/chat/sessions?limit=10&offset=0")

        self.assertEqual(response.status_code, 200)
        item = response.json()["items"][0]
        self.assertEqual(item["session_id"], str(session_id))
        self.assertIn("created_at", item)
        self.assertIn("last_activity_at", item)

    def test_feedback_rating_and_message_role_are_validated(self):
        invalid_rating = self.client.post(
            "/api/feedback",
            json={"message_id": 1, "rating": 0},
        )
        self.assertEqual(invalid_rating.status_code, 422)

        user_message = ChatMessage(id=1, session_id=uuid.uuid4(), role="user", content="Q")
        self.db.messages[1] = user_message
        wrong_role = self.client.post(
            "/api/feedback",
            json={"message_id": 1, "rating": 1},
        )
        self.assertEqual(wrong_role.status_code, 422)

    def test_feedback_submission_and_repeat_updates_same_record(self):
        message_id = 22
        self.db.messages[message_id] = ChatMessage(
            id=message_id,
            session_id=uuid.uuid4(),
            role="assistant",
            content="An answer",
        )
        response = self.client.post(
            "/api/feedback",
            json={"message_id": message_id, "rating": 1, "comment": " useful "},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["updated_existing"])
        self.assertEqual(self.db.feedback_rows[0].comment, "useful")

        self.db.query_results[Feedback] = [self.db.feedback_rows[0]]
        updated = self.client.post(
            "/api/feedback",
            json={"message_id": message_id, "rating": -1},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(updated.json()["updated_existing"])
        self.assertEqual(len(self.db.feedback_rows), 1)
        self.assertEqual(self.db.feedback_rows[0].rating, -1)

    def test_feedback_for_unknown_message_returns_404(self):
        response = self.client.post(
            "/api/feedback",
            json={"message_id": 9876, "rating": 1},
        )
        self.assertEqual(response.status_code, 404)

    def test_staff_feedback_listing_includes_message_and_session(self):
        session_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)
        feedback = Feedback(
            id=3,
            message_id=5,
            rating=1,
            comment="Helpful",
            created_at=timestamp,
            updated_at=timestamp,
        )
        message = ChatMessage(
            id=5,
            session_id=session_id,
            role="assistant",
            content="Answer",
        )
        self.db.query_results[Feedback] = [(feedback, message)]

        response = self.client.get("/api/feedback?rating=1")

        self.assertEqual(response.status_code, 200)
        item = response.json()["items"][0]
        self.assertEqual(item["message"]["session_id"], str(session_id))
        self.assertEqual(item["message"]["content"], "Answer")

    @patch("app.api.documents.ingest_uploaded_pdf")
    def test_pdf_upload_stages_and_ingests_valid_file(self, ingest):
        document_id = uuid.uuid4()
        ingest.return_value = {
            "document_id": str(document_id),
            "filename": "report.pdf",
            "total_chunks": 3,
            "duplicate": False,
        }
        response = self.client.post(
            "/api/documents/upload",
            files={"files": ("report.pdf", b"%PDF-1.7\nminimal", "application/pdf")},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["results"][0]["document_id"], str(document_id))
        ingest.assert_called_once()

    def test_pdf_upload_rejects_bad_extension_without_ingesting(self):
        response = self.client.post(
            "/api/documents/upload",
            files={"files": ("notes.txt", b"not a pdf", "text/plain")},
        )
        self.assertEqual(response.status_code, 207)
        result = response.json()["results"][0]
        self.assertEqual(result["status"], "failed")
        self.assertIn(".pdf", result["error"])

    @patch("app.api.documents.ingest_uploaded_pdf")
    def test_pdf_upload_enforces_per_file_size_limit(self, ingest):
        with patch("app.api.documents.settings.MAX_UPLOAD_FILE_SIZE_BYTES", 5):
            response = self.client.post(
                "/api/documents/upload",
                files={"files": ("large.pdf", b"%PDF-123456", "application/pdf")},
            )
        self.assertEqual(response.status_code, 207)
        self.assertIn("size limit", response.json()["results"][0]["error"])
        ingest.assert_not_called()

    def test_corrupt_pdf_is_reported_as_a_per_file_failure(self):
        response = self.client.post(
            "/api/documents/upload",
            files={"files": ("broken.pdf", b"%PDF-1.7 not actually a PDF", "application/pdf")},
        )
        self.assertEqual(response.status_code, 207)
        self.assertEqual(response.json()["results"][0]["status"], "failed")

    def test_duplicate_upload_outcome_is_reported(self):
        document_id = uuid.uuid4()
        with patch(
            "app.api.documents.ingest_uploaded_pdf",
            return_value={
                "document_id": str(document_id),
                "filename": "report.pdf",
                "total_chunks": 3,
                "duplicate": True,
            },
        ):
            response = self.client.post(
                "/api/documents/upload",
                files={"files": ("report.pdf", b"%PDF-1.7\nminimal", "application/pdf")},
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["results"][0]["status"], "duplicate")

    def test_document_status_deactivation_preserves_chunks(self):
        document_id = uuid.uuid4()
        document = Document(
            id=document_id,
            filename="report.pdf",
            file_size=10,
            status="active",
            is_active=True,
            total_chunks=2,
        )
        self.db.documents[document_id] = document
        response = self.client.patch(
            f"/api/documents/{document_id}/status",
            json={"is_active": False},
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["is_active"])
        self.assertEqual(document.total_chunks, 2)
        self.assertEqual(document.status, "inactive")

    def test_document_listing_reports_chunk_counts_and_filters(self):
        document_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)
        document = Document(
            id=document_id,
            filename="report.pdf",
            file_size=10,
            status="active",
            is_active=True,
            total_chunks=2,
            created_at=timestamp,
        )
        self.db.query_results[Document] = [(document, 2)]
        response = self.client.get("/api/documents?is_active=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["chunk_count"], 2)

    def test_document_delete_reports_no_storage_deletion(self):
        document_id = uuid.uuid4()
        document = Document(
            id=document_id,
            filename="report.pdf",
            file_size=10,
            status="active",
            is_active=True,
            total_chunks=1,
        )
        self.db.documents[document_id] = document
        response = self.client.delete(f"/api/documents/{document_id}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["deleted"])
        self.assertFalse(response.json()["storage_object_deleted"])
        self.assertNotIn(document_id, self.db.documents)

    def test_document_status_database_failure_returns_safe_503(self):
        document_id = uuid.uuid4()
        self.db.documents[document_id] = Document(
            id=document_id,
            filename="report.pdf",
            file_size=10,
            status="active",
            is_active=True,
            total_chunks=1,
        )
        self.db.fail_commit = True
        response = self.client.patch(
            f"/api/documents/{document_id}/status",
            json={"is_active": False},
        )
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private database details", response.text)

    def test_invalid_upload_uuid_and_unknown_document_are_handled(self):
        invalid_uuid = self.client.delete("/api/documents/not-a-uuid")
        self.assertEqual(invalid_uuid.status_code, 422)
        unknown = self.client.patch(
            f"/api/documents/{uuid.uuid4()}/status",
            json={"is_active": True},
        )
        self.assertEqual(unknown.status_code, 404)


class IngestionIdempotencyTests(unittest.TestCase):
    def test_existing_content_hash_skips_pdf_processing(self):
        existing = Document(
            id=uuid.uuid4(),
            filename="original.pdf",
            file_size=20,
            content_sha256=hashlib.sha256(b"identical source bytes").hexdigest(),
            status="active",
            is_active=True,
            total_chunks=2,
        )
        session = IngestionFakeSession(existing=existing)
        with tempfile.TemporaryDirectory() as directory:
            pdf_path = Path(directory) / "upload.pdf"
            pdf_path.write_bytes(b"identical source bytes")
            with patch("app.services.ingestion_service.SessionLocal", return_value=session), patch(
                "app.services.ingestion_service.process_pdf"
            ) as process_pdf:
                result = ingest_pdf(str(pdf_path), filename="new-name.pdf")

        self.assertTrue(result["duplicate"])
        self.assertEqual(result["document_id"], str(existing.id))
        process_pdf.assert_not_called()
        self.assertTrue(session.closed)

    def test_new_document_and_chunks_commit_together(self):
        session = IngestionFakeSession()
        chunks = [
            {
                "content": "Text",
                "page_number": 1,
                "chunk_index": 0,
            }
        ]
        with tempfile.TemporaryDirectory() as directory:
            pdf_path = Path(directory) / "upload.pdf"
            pdf_path.write_bytes(b"new source bytes")
            with patch("app.services.ingestion_service.SessionLocal", return_value=session), patch(
                "app.services.ingestion_service.process_pdf", return_value=chunks
            ), patch(
                "app.services.ingestion_service.generate_document_embeddings",
                return_value=[[0.0] * 384],
            ):
                result = ingest_pdf(str(pdf_path), filename="upload.pdf", file_size=16)

        self.assertEqual(session.commit_count, 1)
        self.assertFalse(result["duplicate"])
        self.assertEqual(result["total_chunks"], 1)
        self.assertEqual(len(session.pending), 2)
        self.assertEqual(len(session.pending[0].content_sha256), 64)


class RetrievalLifecycleTests(unittest.TestCase):
    @patch("app.services.retrieval_service.generate_query_embedding", return_value=[0.0] * 384)
    @patch("app.services.retrieval_service.SessionLocal")
    def test_retrieval_filters_inactive_linked_documents(self, session_local, _embedding):
        query = MagicMock()
        query.outerjoin.return_value = query
        query.filter.return_value = query
        query.order_by.return_value = query
        query.limit.return_value = query
        query.all.return_value = []
        db = session_local.return_value
        db.query.return_value = query

        self.assertEqual(retrieve_relevant_chunks("question"), [])
        self.assertEqual(query.filter.call_count, 2)
        inactive_filter = str(query.filter.call_args_list[1].args[0])
        self.assertIn("is_active", inactive_filter)
        db.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
