---
type: "query"
date: "2026-10-23T07:11:10.245344+00:00"
question: "add this to as template, update template given data for this template,some places have add pics, give option show plus icon and select pic and add it to it"
contributor: "graphify"
outcome: "useful"
source_nodes: ["template-editor.tsx", "registry.tsx", "mock-data.ts"]
---

# Q: add this to as template, update template given data for this template,some places have add pics, give option show plus icon and select pic and add it to it

## Answer

Expanded from the integration request using graph vocabulary: template editor photo save invitation data registry. Existing graph nodes locate components/templates/template-editor.tsx:L1, components/templates/registry.tsx:L1, and lib/mock-data.ts:L1. Current source inspection confirmed lib/storage.ts handles photo optimization and lib/api-validation.ts validates saved invitation data. Added Golden Journey from the supplied Nimesh & Dilhani HTML, source-specific editable details and eight independently persisted photo slots with plus buttons in the editor. Tests verify upload, replacement, deletion, reload and guest presentation.

## Outcome

- Signal: useful

## Source Nodes

- template-editor.tsx
- registry.tsx
- mock-data.ts