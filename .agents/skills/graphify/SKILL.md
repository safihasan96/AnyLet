---
name: Graphify
description: Graphify maps your entire codebase (including code, documentation, PDFs, and media) into a queryable knowledge graph, enabling efficient structural understanding and dependency queries.
---

# Graphify

Graphify indexes your project structure, file imports, call trees, and database schemas into a portable knowledge graph. It exposes this graph via an **MCP server** (`GraphifyMCP`) so the AI agent can query relationships, locate components, and answer architecture questions without reading every file.

## Core Capabilities
- **Codebase Indexing**: Scan and map files, folders, imports, and calls.
- **Interactive Visualization**: Generates `graphify-out/graph.html` — an interactive HTML graph.
- **Architectural Report**: Generates `graphify-out/GRAPH_REPORT.md` — a readable summary.
- **MCP Tool Access**: Exposes tools like `query_graph`, `get_node`, `shortest_path` via the `GraphifyMCP` server.

## Installation
```bash
# After uv is installed (via brew install uv):
uv tool install "graphifyy[mcp]"
```

## Build Workflow
```bash
# 1. Build the knowledge graph for your project:
graphify .

# 2. Start the MCP server (auto-started via mcp_config.json on session load):
/Users/safihasan/.local/bin/graphify-mcp graphify-out/graph.json
```

## MCP Server Connection
This skill is backed by the **`GraphifyMCP`** server registered in `mcp_config.json`:
- **Command**: `/Users/safihasan/.local/bin/graphify-mcp graphify-out/graph.json`
- **Tools available**: `query_graph`, `get_node`, `shortest_path`, and more
- **Note**: Run `graphify .` in your project root first to build the graph before the MCP server can serve it.

## Trigger Phrase
Activate when the user mentions "graphify", "knowledge graph", "codebase map", "visualize project", or "dependency graph".
