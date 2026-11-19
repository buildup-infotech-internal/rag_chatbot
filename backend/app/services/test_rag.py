
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import generate_answer


question = input("Ask your question: ")

print("\nSearching documents...")

chunks = retrieve_relevant_chunks(question, top_k=5)

print(f"Retrieved {len(chunks)} chunks.")

print("\nGenerating answer...\n")

result = generate_answer(question, chunks)

print("=" * 60)
print("ANSWER")
print("=" * 60)
print(result["answer"])

print("\n" + "=" * 60)
print("SOURCES")
print("=" * 60)

for source in result["sources"]:
    print(
        f"{source['source_filename']} - "
        f"Page {source['page_number']}"
    )
