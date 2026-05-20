import os
import sys

import requests

VECTOR_SEARCH_URL = os.getenv("VECTOR_SEARCH_URL", "https://knowledge.armdevtechapi.com")
AOAI_CHAT_URL = os.getenv(
    "AOAI_CHAT_URL",
    "https://arm-ip-explorer-foundry.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2024-08-01-preview",
)
AOAI_API_KEY = os.getenv("AOAI_API_KEY", "").strip()


def extract_text(hit):
    if isinstance(hit, dict):
        for key in ["text", "content", "chunk", "document", "body"]:
            value = hit.get(key)
            if value:
                return value
    return str(hit)


def retrieve(query, top_k=3):
    resp = requests.post(
        f"{VECTOR_SEARCH_URL}/search",
        json={"query": query},
        timeout=30,
    )
    resp.raise_for_status()

    data = resp.json()
    hits = data if isinstance(data, list) else data.get("results", [])

    return hits[:top_k]


def answer_question(query):
    if not AOAI_API_KEY:
        raise RuntimeError("AOAI_API_KEY is not set")

    hits = retrieve(query)

    context = "\n\n".join(
        f"[Doc {i}]\nTitle: {hit.get('title', '')}\nSource: {hit.get('source', '')}\n{extract_text(hit)}"
        for i, hit in enumerate(hits, start=1)
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a retrieval-augmented assistant. "
                "You MUST answer ONLY using information explicitly present in the provided context documents. "
                "Do NOT use any knowledge from your training data. "
                "Do NOT invent, infer, or generate content that is not directly stated in the context. "
                "If the context does not contain enough information to answer the question, respond with: "
                "'I don't have enough information in my knowledge base to answer that.' "
                "When referencing sources, you MUST select ONLY from the exact URLs listed in the 'Source:' fields of the provided context documents. "
                "These are the only valid links. Never fabricate, modify, or guess URLs. "
                "If no relevant source URL exists in the context, do not provide a link."
            ),
        },
        {
            "role": "user",
            "content": f"Using ONLY the context documents below, answer the following question.\n\nQuestion: {query}\n\nContext:\n{context}",
        },
    ]
    resp = requests.post(
        AOAI_CHAT_URL,
        headers={
            "Content-Type": "application/json",
            "api-key": AOAI_API_KEY,
        },
        json={
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 2000,
        },
        timeout=60,
    )
    resp.raise_for_status()

    data = resp.json()
    return data["choices"][0]["message"]["content"]


def main():
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:]).strip()
    else:
        query = input("Enter your question: ").strip()

    if not query:
        print("Empty query.")
        sys.exit(1)

    try:
        answer = answer_question(query)
        print(answer)
    except requests.exceptions.HTTPError as err:
        print(f"HTTP error: {err}")
        if err.response is not None:
            print(f"Status: {err.response.status_code}")
            print(f"Response: {err.response.text}")
        sys.exit(1)
    except requests.exceptions.RequestException as err:
        print(f"Request failed: {err}")
        sys.exit(1)
    except KeyError as err:
        print(f"Unexpected response format, missing key: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
