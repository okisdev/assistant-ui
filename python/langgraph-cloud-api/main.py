"""
LangGraph Cloud API compatible backend.

Implements the subset of the LangGraph Cloud REST API needed by
`@langchain/langgraph-sdk` Client used in examples/with-langgraph:
  - POST /threads
  - GET  /threads/{thread_id}/state
  - POST /threads/{thread_id}/runs/stream  (SSE, messages-tuple format)
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    HumanMessage,
    ToolMessage,
)
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel

load_dotenv()  # .env
load_dotenv(".env.local", override=True)  # .env.local takes precedence

# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    # Stub implementation for demo purposes
    weathers = {
        "new york": "72°F, sunny",
        "london": "15°C, cloudy",
        "tokyo": "25°C, partly cloudy",
        "paris": "18°C, rainy",
    }
    return weathers.get(city.lower(), f"Weather data not available for {city}")


@tool
def calculate(expression: str) -> str:
    """Evaluate a math expression. E.g. '2 + 2' or '100 / 3'."""
    try:
        result = eval(expression, {"__builtins__": {}})  # noqa: S307
        return str(result)
    except Exception as e:
        return f"Error evaluating expression: {e}"


tools = [get_weather, calculate]

# ---------------------------------------------------------------------------
# Graph
# ---------------------------------------------------------------------------


class AgentState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages]


def create_graph():
    llm = ChatOpenAI(model="gpt-4o-mini", streaming=True).bind_tools(tools)

    async def agent(state: AgentState):
        response = await llm.ainvoke(state.messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state.messages[-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tools"
        return END

    tool_node = ToolNode(tools)

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


graph = create_graph()

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------

threads_store: dict[str, dict[str, Any]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _make_thread(thread_id: Optional[str] = None, metadata: Optional[dict] = None) -> dict:
    tid = thread_id or str(uuid.uuid4())
    now = _now_iso()
    t = {
        "thread_id": tid,
        "created_at": now,
        "updated_at": now,
        "metadata": metadata or {},
        "status": "idle",
        "values": {},
        "interrupts": {},
    }
    threads_store[tid] = t
    return t


# ---------------------------------------------------------------------------
# Helpers – serialise LangChain messages
# ---------------------------------------------------------------------------


def _lc_message_to_dict(msg: BaseMessage) -> dict:
    """Convert a LangChain message to the dict format expected by the SDK."""
    d: dict[str, Any] = {
        "content": msg.content,
        "additional_kwargs": msg.additional_kwargs or {},
        "response_metadata": getattr(msg, "response_metadata", {}) or {},
        "id": msg.id or str(uuid.uuid4()),
    }
    if isinstance(msg, HumanMessage):
        d["type"] = "human"
    elif isinstance(msg, AIMessage):
        d["type"] = "ai"
        if msg.tool_calls:
            d["tool_calls"] = [
                {
                    "id": tc["id"],
                    "name": tc["name"],
                    "args": tc["args"],
                    "type": "tool_call",
                }
                for tc in msg.tool_calls
            ]
        else:
            d["tool_calls"] = []
        d["invalid_tool_calls"] = []
    elif isinstance(msg, ToolMessage):
        d["type"] = "tool"
        d["tool_call_id"] = msg.tool_call_id
    else:
        d["type"] = msg.type
    return d


def _chunk_to_dict(chunk: AIMessageChunk) -> dict:
    """Convert an AIMessageChunk to the messages-tuple dict format."""
    d: dict[str, Any] = {
        "content": chunk.content,
        "additional_kwargs": chunk.additional_kwargs or {},
        "response_metadata": getattr(chunk, "response_metadata", {}) or {},
        "type": "AIMessageChunk",
        "name": None,
        "id": chunk.id or str(uuid.uuid4()),
        "tool_calls": [],
        "invalid_tool_calls": [],
        "usage_metadata": getattr(chunk, "usage_metadata", None),
    }
    if chunk.tool_call_chunks:
        d["tool_call_chunks"] = [
            {
                "name": tc.get("name", ""),
                "args": tc.get("args", ""),
                "id": tc.get("id", ""),
                "index": tc.get("index", 0),
                "type": "tool_call_chunk",
            }
            for tc in chunk.tool_call_chunks
        ]
    else:
        d["tool_call_chunks"] = []
    return d


def _input_messages_to_lc(messages: list[dict]) -> list[BaseMessage]:
    """Convert SDK input messages (dicts) to LangChain message objects."""
    result: list[BaseMessage] = []
    for m in messages:
        role = m.get("type") or m.get("role", "human")
        content = m.get("content", "")
        msg_id = m.get("id")

        if role in ("human", "user"):
            result.append(HumanMessage(content=content, id=msg_id))
        elif role in ("ai", "assistant"):
            result.append(AIMessage(content=content, id=msg_id))
        elif role == "tool":
            result.append(
                ToolMessage(
                    content=content,
                    tool_call_id=m.get("tool_call_id", ""),
                    id=msg_id,
                )
            )
        else:
            result.append(HumanMessage(content=content, id=msg_id))
    return result


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="LangGraph Cloud API (compat)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- POST /threads --------------------------------------------------------


@app.post("/threads")
async def create_thread(request: Request):
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    t = _make_thread(
        thread_id=body.get("thread_id"),
        metadata=body.get("metadata"),
    )
    return t


# ---- GET /threads/{thread_id}/state ----------------------------------------


@app.get("/threads/{thread_id}/state")
async def get_thread_state(thread_id: str):
    t = threads_store.get(thread_id)
    if t is None:
        return {"values": {}, "next": [], "tasks": [], "metadata": {}, "created_at": None, "checkpoint": {}, "parent_checkpoint": None}

    return {
        "values": t.get("values", {}),
        "next": [],
        "tasks": [],
        "metadata": t.get("metadata", {}),
        "created_at": t.get("created_at"),
        "checkpoint": {
            "thread_id": thread_id,
            "checkpoint_ns": "",
            "checkpoint_id": None,
            "checkpoint_map": None,
        },
        "parent_checkpoint": None,
    }


# ---- POST /threads/{thread_id}/runs/stream --------------------------------


@app.post("/threads/{thread_id}/runs/stream")
async def stream_run(thread_id: str, request: Request):
    body = await request.json()
    input_data = body.get("input") or {}
    # body also has: assistant_id, config, stream_mode, etc.

    # Ensure thread exists
    if thread_id not in threads_store:
        _make_thread(thread_id)

    thread = threads_store[thread_id]
    run_id = str(uuid.uuid4())

    # Build input messages
    existing_messages: list[BaseMessage] = thread.get("_messages", [])
    new_messages = _input_messages_to_lc(input_data.get("messages", []))
    all_messages = existing_messages + new_messages

    async def event_stream():
        # metadata event
        yield _sse("metadata", {"run_id": run_id})

        # Use both "messages" and "values" stream modes so we can:
        # 1. Stream message chunks as SSE events ("messages" mode)
        # 2. Capture the final graph state for persistence ("values" mode)
        # With multiple modes, events are yielded as (mode_name, data) tuples.
        final_state_messages: Optional[list[BaseMessage]] = None

        async for mode, data in graph.astream(
            {"messages": all_messages},
            stream_mode=["messages", "values"],
        ):
            if mode == "messages":
                # "messages" mode data is (message_chunk, metadata_dict)
                chunk, meta = data
                if isinstance(chunk, AIMessageChunk):
                    chunk_dict = _chunk_to_dict(chunk)
                    tags = meta.get("tags", []) if isinstance(meta, dict) else []
                    yield _sse("messages", [chunk_dict, {"tags": tags}])
            elif mode == "values":
                # "values" mode yields the full state dict after each super-step.
                # The last one is the final state.
                final_state_messages = data.get("messages")

        # Persist messages and values
        if final_state_messages is not None:
            thread["_messages"] = final_state_messages
            thread["values"] = {
                "messages": [_lc_message_to_dict(m) for m in final_state_messages]
            }
        thread["updated_at"] = _now_iso()

        # End event
        yield _sse("end", None)

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Location": f"/threads/{thread_id}/runs/{run_id}",
    }
    return StreamingResponse(event_stream(), media_type="text/event-stream", headers=headers)


def _sse(event: str, data: Any) -> str:
    payload = json.dumps(data) if data is not None else ""
    return f"event: {event}\ndata: {payload}\n\n"


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8123)
