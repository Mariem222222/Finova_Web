import requests
import os
import base64
from typing import List
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings

class Chatbot:
    def __init__(self, api_key: str, kb_folder: str = "knowledge_base"):
        self.api_key = api_key
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        self.kb_folder = kb_folder
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
        self.vector_store = None
        self._initialize_vector_store()

    def _initialize_vector_store(self):
        """Initialize the vector store with existing documents."""
        if not os.path.exists(self.kb_folder):
            os.makedirs(self.kb_folder)
            return

        texts = []
        metadatas = []
        for fname in os.listdir(self.kb_folder):
            file_path = os.path.join(self.kb_folder, fname)
            if fname.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    texts.append(content)
                    metadatas.append({"source": fname})
            elif fname.endswith(".pdf"):
                texts_from_pdf, meta_from_pdf = self._process_pdf(file_path)
                texts.extend(texts_from_pdf)
                metadatas.extend(meta_from_pdf)

        if texts:
            self.vector_store = Chroma.from_texts(
                texts=texts,
                embeddings=self.embeddings,
                metadatas=metadatas
            )

    def _process_pdf(self, pdf_path: str) -> tuple[List[str], List[dict]]:
        """Process a PDF file and return chunks of text with their metadata."""
        pdf = PyPDF2.PdfReader(pdf_path)
        pdf_text = ""
        for page in pdf.pages:
            pdf_text += page.extract_text()

        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        texts = text_splitter.split_text(pdf_text)
        
        # Create metadata for each chunk
        metadatas = [{"source": os.path.basename(pdf_path), "chunk": i} for i in range(len(texts))]
        return texts, metadatas

    def add_document(self, file_path: str):
        """Add a new document to the knowledge base."""
        if file_path.endswith(".pdf"):
            texts, metadatas = self._process_pdf(file_path)
        elif file_path.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                texts = [content]
                metadatas = [{"source": os.path.basename(file_path)}]
        else:
            raise ValueError("Unsupported file format. Only .pdf and .txt files are supported.")

        if self.vector_store is None:
            self.vector_store = Chroma.from_texts(
                texts=texts,
                embeddings=self.embeddings,
                metadatas=metadatas
            )
        else:
            self.vector_store.add_texts(texts=texts, metadatas=metadatas)

    def retrieve_context(self, question: str, top_k: int = 3) -> List[str]:
        """
        Retrieve relevant context from the knowledge base using vector similarity search.
        """
        if self.vector_store is None:
            return []
            
        results = self.vector_store.similarity_search_with_score(question, k=top_k)
        contexts = []
        for doc, score in results:
            if score < 1.5:  # Only include relevant matches
                contexts.append(doc.page_content)
        return contexts

    def ask(self, question: str, image_path: str = None) -> str:
        """
        Use RAG: retrieve context, then send both context and question (and optionally an image) to Gemini API.
        """
        headers = {"Content-Type": "application/json"}
        context_list = self.retrieve_context(question)
        context = "\n".join(context_list) if context_list else ""
        system_prompt = (
            "You are a friendly, helpful financial assistant. "
            "Answer in a clear, concise, and encouraging way. "
            "Use simple language and emojis if appropriate."
        )
        prompt = f"{system_prompt}\n\n{context}\n\nQuestion: {question}" if context else question
        parts = [{"text": prompt}]
        if image_path and os.path.exists(image_path):
            with open(image_path, "rb") as img_file:
                img_b64 = base64.b64encode(img_file.read()).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",  # Change if you support other types
                    "data": img_b64
                }
            })
        payload = {
            "contents": [{
                "parts": parts
            }]
        }
        try:
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data.get("contents", [{}])[0].get("parts", [{}])[0].get("text", "No response available.")
        except requests.exceptions.RequestException as e:
            print(f"Error communicating with the Gemini API: {e}")
            return "Sorry, I couldn't process your request at the moment."
