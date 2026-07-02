---
title: Agent Skill — Graphify
type: agent-skill
tags: [agent-skills, graphify, knowledge-graph]
status: stable
last-scanned: 2026-06-28
related: []
---

# Agent Skill: Graphify

Located in `.agents/skills/graphify/SKILL.md`.

## Purpose
Maps the entire AnyLet codebase (code, docs, media) into a queryable knowledge graph. Outputs reside in `graphify-out/`.

## Enforcement
Dictates that for complex architecture or dependency questions, agents should use Graphify CLI/MCP commands (`query`, `shortest_path`, `explain`) to traverse relationships, rather than executing brute-force grep commands.
