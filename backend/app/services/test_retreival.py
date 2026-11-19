from app.services.retrieval_service import retrieve_relevant_chunks

question = "What is the company's policy regarding work-from-home arrangements?"

results = retrieve_relevant_chunks(question, top_k=5)

if not results:
    print("No relevant chunks found.")
else:
    for index, result in enumerate(results, start=1):
        print(f"\n--- Result {index} ---")
        print("Source:", result["source_filename"])
        print("Page:", result["page_number"])
        print("Similarity:", result["similarity"])
        print("Content:", result["content"][:500])
