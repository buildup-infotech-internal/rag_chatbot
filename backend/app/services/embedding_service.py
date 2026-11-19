from functools import lru_cache

from fastembed import TextEmbedding


MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIMENSION = 384


@lru_cache(maxsize=1)
def get_embedding_model():
    """Load the embedding model once and reuse it."""
    return TextEmbedding(model_name=MODEL_NAME)


def generate_document_embeddings(
    texts: list[str]
) -> list[list[float]]:
    """Generate embeddings for document chunks."""

    if not texts:
        return []

    model = get_embedding_model()

    embeddings = model.passage_embed(texts)

    return [embedding.tolist() for embedding in embeddings]


def generate_query_embedding(query: str) -> list[float]:
    """Generate an embedding for a user's question."""

    if not query.strip():
        raise ValueError("Query cannot be empty.")

    model = get_embedding_model()

    embedding = next(model.query_embed(query))

    return embedding.tolist()
