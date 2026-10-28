---
type: "query"
date: "2026-10-24T13:35:01.157256+00:00"
question: "is wedding_invitation_01 folder path used in main project"
contributor: "graphify"
outcome: "useful"
source_nodes: ["Wedding", "Template", "Invitation"]
---

# Q: is wedding_invitation_01 folder path used in main project

## Answer

Expanded from original query via vocab: [wedding, invitation, invitations, template, templates, paths]. Traversed graph and inspected workspace codebase. The exact folder path 'wedding_invitation_01' is not imported, referenced, or routed anywhere in the main Next.js project. Instead, it was an external/supplied static template bundle: its assets were copied into public/templates/wedding-01/ (e.g. poruwa.webp used in app/globals.css), and its markup/design was converted into the React template WeddingIvory in components/templates/wedding-ivory.tsx.

## Outcome

- Signal: useful

## Source Nodes

- Wedding
- Template
- Invitation