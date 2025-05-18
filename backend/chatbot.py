import requests
import os
import base64
from typing import List

class Chatbot:
    def __init__(self, api_key: str, kb_folder: str = "knowledge_base"):
        self.api_key = api_key
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        self.kb_folder = kb_folder

    def retrieve_context(self, question: str, top_k: int = 1) -> List[str]:
        """
        Retrieve relevant context from the knowledge base using keyword matching.
        """
        if not os.path.exists(self.kb_folder):
            return []
        best_matches = []
        for fname in os.listdir(self.kb_folder):
            if fname.endswith(".txt"):
                with open(os.path.join(self.kb_folder, fname), "r", encoding="utf-8") as f:
                    content = f.read()
                    score = sum(word.lower() in content.lower() for word in question.split())
                    best_matches.append((score, content))
        best_matches.sort(reverse=True, key=lambda x: x[0])
        return [c for s, c in best_matches[:top_k] if s > 0]

    def ask(self, question: str, image_path: str = None) -> str:
        """
        Use RAG: retrieve context, then send both context and question (and optionally an image) to Gemini API.
        """
        headers = {"Content-Type": "application/json"}
        context_list = self.retrieve_context(question)
        context = "\n".join(context_list) if context_list else ""
        prompt = f"Context: {context}\n\nQuestion: {question}" if context else question
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
