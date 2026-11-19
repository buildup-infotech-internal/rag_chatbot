
from fastapi import FastAPI

app = FastAPI(
    title="Multilingual RAG Chatbot API",
    description="Backend API for a document-based question-answering chatbot",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "RAG Chatbot API is running!"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
