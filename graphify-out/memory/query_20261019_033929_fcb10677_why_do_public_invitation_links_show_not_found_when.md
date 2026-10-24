---
type: "query"
date: "2026-10-19T03:39:29.147664+00:00"
question: "Why do public invitation links show not found when opened in another browser, and how are invitations, guest tokens, and storage connected?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["PublicInvitationPage()", "getInvitationBySlug()", "loadState()", "InvitationManagement()"]
---

# Q: Why do public invitation links show not found when opened in another browser, and how are invitations, guest tokens, and storage connected?

## Answer

Expanded from graph vocabulary via [public, invitation, token, guest, state, supabase, database]. PublicInvitationPage looks up invitation slugs and guest tokens through lib/invitations.ts. The mock data layer stores invitations and guests in browser localStorage (loadState/saveState), so another browser has no matching records. Supabase clients exist, but application table access is still marked TODO and the repository says the database schema was not supplied. New share links now carry a guest-safe invitation snapshot for cross-browser rendering; RSVP responses are not synced to the host until persistent shared storage is implemented.

## Outcome

- Signal: useful

## Source Nodes

- PublicInvitationPage()
- getInvitationBySlug()
- loadState()
- InvitationManagement()