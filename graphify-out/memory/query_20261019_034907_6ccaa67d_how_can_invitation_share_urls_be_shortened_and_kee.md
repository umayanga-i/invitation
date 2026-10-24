---
type: "query"
date: "2026-10-19T03:49:07.118887+00:00"
question: "How can invitation share URLs be shortened and keep invitation data out of query parameters?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["InvitationManagement()", "PublicInvitationPage()", "loadState()", "getInvitationBySlug()"]
---

# Q: How can invitation share URLs be shortened and keep invitation data out of query parameters?

## Answer

Expanded from graph vocabulary via [database, guest, invitation, link, public, server, share, token]. InvitationManagement builds personal and common links; public invitation lookups use browser-local mock storage. The repository has Supabase clients but no supplied schema for persistent share records. Implemented POST /api/shares to create AES-256-GCM encrypted, DEFLATE-compressed opaque tokens, served through /s/[token]. INVITATION_SHARE_SECRET is required and must stay stable. This avoids plaintext invitation data in query strings and compresses the URL, but a truly short random ID still requires a persistent shared database table.

## Outcome

- Signal: useful

## Source Nodes

- InvitationManagement()
- PublicInvitationPage()
- loadState()
- getInvitationBySlug()