---
type: "query"
date: "2026-10-22T12:44:54.225621+00:00"
question: "Audit the pages, layouts, navbar, and authentication involved in sharing the logged-in header."
contributor: "graphify"
outcome: "useful"
source_nodes: ["app/layout.tsx", "navbar.tsx", "auth.ts", "template-editor.tsx"]
---

# Q: Audit the pages, layouts, navbar, and authentication involved in sharing the logged-in header.

## Answer

Expanded from the graph vocabulary: auth navbar layout dashboard editor invitation shell user template. The existing graph identifies app/layout.tsx at L1, navbar.tsx at L1, lib/auth.ts at L1, and template-editor.tsx at L1. It also references a former components/invitations/workspace.tsx that no longer exists, so this graph provides orientation rather than a complete current header audit. Direct source verification was needed before implementing the requested shared root header.

## Outcome

- Signal: useful

## Source Nodes

- app/layout.tsx
- navbar.tsx
- auth.ts
- template-editor.tsx