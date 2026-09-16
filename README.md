# Aether AI

Aether AI is a full-stack AI chat application with authentication, persistent conversations, document-based RAG, and a modular backend architecture for local and cloud LLMs.

## Features

- JWT-based authentication and protected routes
- Multi-conversation chat interface
- Streaming LLM responses from Ollama or OpenAI
- Conversation history persistence in SQLite
- Document upload and indexing for RAG
- Local vector storage and retrieval
- Markdown rendering with code blocks and syntax highlighting
- Light/dark theme and responsive layout
- FastAPI backend with a modular service layer

## Architecture

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy + Pydantic
- Database: SQLite by default, ready for PostgreSQL
- LLM abstraction: provider-based architecture for Ollama/OpenAI
- RAG pipeline: document ingestion, chunking, embedding, retrieval

## Project structure

- [backend](backend)
- [frontend](frontend)
- [data](data)

## Local development

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

Create a backend environment file from the example if needed:

```bash
copy .env.example .env
```

Then run:

```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is expected to run on:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## Ollama setup

1. Install Ollama from https://ollama.com.
2. Start the local server:

```bash
ollama serve
```

3. Pull a model:

```bash
ollama pull llama3.2
```

4. Confirm the model is available:

```bash
ollama list
```

5. Ensure the backend environment uses the correct local URL and model:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

If Ollama is not running, the API will return a helpful error message and still keep the app usable.

## OpenAI setup

If you want a cloud model instead of Ollama:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Image generation

Ollama models such as `llama3.2` generate text and cannot create image files. To enable the **Image** button in the chat composer, configure an OpenAI key in `backend/.env`:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_IMAGE_MODEL=gpt-image-1
```

Then enter an image description after clicking **Image**. Aether AI saves the generated PNG under `data/generated_images` and displays it in the conversation.

## API docs

FastAPI auto-generates API docs at:

- http://localhost:8000/api/docs
- http://localhost:8000/api/redoc

## Notes

- Secrets remain on the backend.
- The database is SQLite by default.
- Uploaded files and vector data are stored under the [data](data) folder.
- The project is intentionally structured so the LLM and embedding providers can be swapped later without rewriting the application logic.
