#!/bin/bash
# Start both the FastAPI backend (port $PORT) and MCP server (port 8001)
# On Railway: configure custom domain mcp.agentsoul.app → port 8001

echo "Starting AgentSoul FastAPI backend on port $PORT..."
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" &
FASTAPI_PID=$!

echo "Starting AgentSoul MCP server on port 8001..."
python -m agentsoul_mcp.server &
MCP_PID=$!

# Wait for either process to exit (both should run indefinitely)
wait $FASTAPI_PID $MCP_PID
