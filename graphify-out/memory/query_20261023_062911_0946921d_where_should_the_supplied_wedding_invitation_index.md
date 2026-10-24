---
type: "query"
date: "2026-10-23T06:29:11.846351+00:00"
question: "Where should the supplied wedding invitation index.html template be integrated?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["registry.tsx", "template-editor.tsx", "public-invitation-page.tsx", "Template"]
---

# Q: Where should the supplied wedding invitation index.html template be integrated?

## Answer

Expanded from the integration request using graph vocabulary: template registry wedding editor public invitation. The graph located registry.tsx (components/templates/registry.tsx:L1), template-editor.tsx (components/templates/template-editor.tsx:L1), public-invitation-page.tsx (components/invitations/public-invitation-page.tsx:L1), and Template (lib/mock-data.ts:L32). Current source inspection confirmed these entry points. The new wedding-ivory template is registered with catalog data, a scoped React component, editor preview and public full-page presentation using the shared persisted RSVP form.

## Outcome

- Signal: useful

## Source Nodes

- registry.tsx
- template-editor.tsx
- public-invitation-page.tsx
- Template