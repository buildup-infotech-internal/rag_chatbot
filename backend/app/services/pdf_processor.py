import pymupdf
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extract_pdf_pages(pdf_path: str) -> list[dict]:
    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF files are supported.")

    pages = []

    with pymupdf.open(pdf_path) as document:
        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text").strip()

            if text:
                pages.append({
                    "page_number": page_number,
                    "text": text
                })

    return pages


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len
    )

    return splitter.split_text(text)


def process_pdf(pdf_path: str) -> list[dict]:
    pages = extract_pdf_pages(pdf_path)

    all_chunks = []
    filename = Path(pdf_path).name

    for page in pages:
        page_chunks = chunk_text(page["text"])

        for chunk_index, content in enumerate(page_chunks):
            all_chunks.append({
                "content": content,
                "source_filename": filename,
                "page_number": page["page_number"],
                "chunk_index": chunk_index
            })

    return all_chunks
