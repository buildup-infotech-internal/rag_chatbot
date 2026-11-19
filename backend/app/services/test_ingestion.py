
from app.services.ingestion_service import ingest_pdf

pdf_path = "../documents/sample.pdf"

try:
    result = ingest_pdf(pdf_path)

    print("Ingestion successful!")
    print("Document ID:", result["document_id"])
    print("Filename:", result["filename"])
    print("Total chunks:", result["total_chunks"])
    print("Status:", result["status"])

except Exception as error:
    print("Ingestion failed:", error)
