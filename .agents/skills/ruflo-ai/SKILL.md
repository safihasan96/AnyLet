---
name: Ruflo AI
description: Ruflo is an advanced multi-agent AI orchestration platform that provides swarm intelligence, memory management, and 300+ MCP tools for coordinated agent workflows.
---

# Ruflo AI

Ruflo (formerly Claude Flow) is an open-source multi-agent orchestration platform that transforms an AI assistant into a coordinated team of specialized agents with persistent memory and parallel execution capabilities.

## Core Capabilities
- **Swarm Orchestration**: Coordinate multiple agents in parallel for complex tasks.
- **Persistent Memory**: Cross-session memory with `memory_store` and `memory_retrieve`.
- **300+ MCP Tools**: Access tools covering memory, swarm coordination, neural routing, embeddings, security, and development.
- **Goal-Oriented Planning**: Decompose high-level instructions into actionable sub-steps.
- **Agent Federation**: Securely collaborate across different machines and sessions.

## Usage Guide
- **Initialize in project**: `npx ruflo@latest init wizard` — sets up orchestration config and registers the MCP server.
- **Start MCP server**: `npx ruflo@latest mcp start` — starts the local MCP server exposing all Ruflo tools.
- **Spawn a swarm**: Use the `swarm_init` tool to create and configure a swarm for parallel tasks.
- **Store memory**: Use `memory_store` to persist context across sessions.

## MCP Server Connection
This skill is backed by the `RufloMCP` MCP server registered in `mcp_config.json`. All Ruflo tools are available as first-class MCP tools within this agent session.

## Trigger Phrase
Activate this skill when the user mentions "ruflo", "swarm", "multi-agent", "agent orchestration", "parallel agents", or "persistent memory".
