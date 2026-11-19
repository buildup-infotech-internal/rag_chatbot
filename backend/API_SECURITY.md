# API deployment and security notes

## Administrative endpoints are not authenticated

The API is intentionally anonymous today. `GET /api/chat/sessions` and `GET /api/feedback` expose conversation/session metadata and feedback (including associated message text). Do not publish these routes on an internet-facing deployment until staff authentication and authorization have been added. Document upload, document status changes, and document deletion are also unauthenticated administrative operations and must be restricted before deployment.

## Rate limiting and upload limits

The application enforces configurable per-file size and batch-count limits for PDF uploads. It does not implement rate limiting: a process-local counter would be bypassable across workers and restarts. Apply rate limits at an API gateway or with a shared store (for example Redis) for public chat and upload routes before deployment.

## CORS and environment

Set `CORS_ORIGINS` to a comma-separated allowlist of exact frontend origins (for example, `http://localhost:3000`). Do not use `*` in production. Optional settings are `LOG_LEVEL` (default `INFO`), `MAX_UPLOAD_FILE_SIZE_BYTES` (default 10 MiB), and `MAX_UPLOAD_FILES` (default 5). Existing required settings remain `DATABASE_URL` and `GROQ_API_KEY`; never expose them to the Next.js client.

## PDF storage and deletion

Uploads are staged in server-generated temporary files and removed after ingestion. The existing project has no Supabase Storage client or persistent binary upload integration. `DELETE /api/documents/{document_id}` deletes document metadata and linked chunks through the existing database cascade only; it reports `storage_object_deleted: false` and does not claim to remove a remote binary.

## Migration and duplicate handling

Run the new Alembic migration before deploying the updated API; it adds nullable `documents.content_sha256` and a unique index used to avoid repeat and concurrent duplicate content ingestions. Existing document rows remain with a null hash, because their original PDF bytes are not available for a safe backfill. Identical uploads are deduplicated after they have a stored hash. The migration is not applied automatically.

## Anonymous chat limitations

Session UUIDs are unguessable identifiers, not authentication or ownership proofs. History is accessible to anyone who knows a session UUID. Add authentication/authorization or another privacy boundary before using the service for sensitive conversations.
