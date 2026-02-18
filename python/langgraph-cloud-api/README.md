# LangGraph Cloud API (Compatible Backend)

Minimal FastAPI server implementing the LangGraph Cloud REST API endpoints needed by `examples/with-langgraph`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/threads` | Create a thread |
| GET | `/threads/{id}/state` | Get thread state |
| POST | `/threads/{id}/runs/stream` | SSE streaming run (messages-tuple format) |

## Setup

```bash
cd python/langgraph-cloud-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your OPENAI_API_KEY
```

## Run

```bash
python main.py
# Server starts on http://localhost:8123
```

## Use with the example

```bash
# In examples/with-langgraph/.env.local:
LANGGRAPH_API_URL=http://localhost:8123
NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=agent

# Then:
PORT=3001 pnpm --filter with-langgraph dev
```
