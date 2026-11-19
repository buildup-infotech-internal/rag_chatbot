
from groq import Groq
from app.core.config import settings


# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

# Model configuration
MODEL_NAME = "qwen/qwen3.8-27b"

def generate_answer(question: str, retrieved_chunks: list[dict]) -> dict:

    if not retrieved_chunks:
        return {
            "answer": "I'm sorry, but I couldn't find relevant information in the provided documents to answer your question.",
            "sources": []
        }

    # Build context from retrieved chunks
    context_parts = []

    for index, chunk in enumerate(retrieved_chunks, start=1):
        context_parts.append(
            f"""
            Context {index}
            Source: {chunk['source_filename']}
            Page: {chunk['page_number']}
            Content: {chunk['content']}
            """
        )

    context = "\n".join(context_parts)

    system_prompt = """
    You are a helpful company document assistant.

    Answer the user's question using ONLY the information
    provided in the retrieved document context.

    Instructions:
    1. Do not use outside knowledge.
    2. Do not invent facts, policies, numbers, or dates.
    3. If the context does not contain enough information,
       politely say that the information is not available
       in the provided documents.
    4. Combine information from multiple contexts when relevant.
    5. Give clear, structured and concise answers.
    6. Support factual statements with source citations
       using this format: [Source: filename, Page: X].
    7. Understand and respond in the same language as
       the user's question, including Hindi and Hinglish.
    """

    user_prompt = f"""
    Retrieved Document Context:

    {context}

    User Question:
    {question}

    Provide a helpful answer based strictly on the context.
    """

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.1,
        max_completion_tokens=1500
    )

    answer = response.choices[0].message.content

    # Prepare source references
    sources = []

    seen_sources = set()

    for chunk in retrieved_chunks:
        source_key = (
            chunk["source_filename"],
            chunk["page_number"]
        )

        if source_key not in seen_sources:
            seen_sources.add(source_key)

            sources.append({
                "source_filename": chunk["source_filename"],
                "page_number": chunk["page_number"]
            })

    return {
        "answer": answer,
        "sources": sources
    }
