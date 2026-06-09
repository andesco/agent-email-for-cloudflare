# Agent Email for Cloudflare

Private, temporary Cloudflare Email Worker inbox for coding agents.

The intended tool split is:

- **Wrangler:** deploy the Worker, automatically provision D1/R2, and configure
  the Email Routing address.
- **Cloudflare MCP:** discover the deployed mailbox and read messages from D1/R2.

## Deploy To Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/agent-email-for-cloudflare)

The deploy flow creates a copy of the repository, deploys the Worker, and
automatically provisions its D1 database and R2 bucket. The Worker initializes
the D1 schema on first use.

The button is a user-assisted browser flow. It may require the user to
authenticate, choose a Cloudflare account, authorize GitHub/GitLab access, and
confirm deployment. A coding agent with authenticated Wrangler access can deploy
the repository autonomously and use the same binding-only configuration to
automatically provision D1 and R2.

After deployment, use authenticated Wrangler to choose a domain with Email
Routing enabled and create a literal address, such as `agent@example.com`, whose
action sends email to the deployed Worker.

Incoming messages are stored in the automatically provisioned private R2 bucket:

- `messages/<received-at>-<id>.json`: parsed, agent-friendly email content and metadata
- `messages/<received-at>-<id>.eml`: original raw RFC 822 message

The automatically provisioned D1 database indexes messages and bounded body
previews for Cloudflare MCP queries. Complete parsed content remains in R2. A
cron trigger runs every minute and deletes objects and index rows once they are
24 hours old.

## Manual Deploy

```bash
npm install
npm run types
npm run deploy
```

Wrangler automatically provisions the D1 and R2 bindings. Create the literal
Email Routing address with Wrangler's Email Routing commands.

## Read With Cloudflare MCP

Use Cloudflare MCP to discover the Email Routing rule, deployed Worker, D1
database, and R2 bucket. Query the discovered D1 database with:

```sql
SELECT * FROM emails ORDER BY received_at DESC
```

Use the returned `json_key` or `raw_key` to fetch complete content from the
discovered R2 bucket.

The R2 bucket is private and the Worker has no HTTP handler.

## Agent Skills

The shared `check-agent-email` skill is available to:

- Codex: `.agents/skills/check-agent-email`
- Claude Code: `.claude/skills/check-agent-email`

It instructs agents to use Cloudflare MCP to discover an available agent mailbox
and its backing D1/R2 resources, then enter the discovered address and check for
verification links, codes, replies, or other messages. It does not use Wrangler
or local helper scripts.

See [SUGGESTED_PROMPT.md](SUGGESTED_PROMPT.md) for a prompt that directs a coding
agent to deploy the Worker and address, verify them, and explain how to check the
inbox through Cloudflare MCP.

## Local Test

```bash
npm run dev
```

In another shell, using the address attached after deployment:

```bash
curl -X POST "http://localhost:8787/cdn-cgi/handler/email?from=sender@example.com&to=agent@example.com" \
  -H "Content-Type: application/json" \
  --data-binary $'From: sender@example.com\nTo: agent@example.com\nSubject: Test\n\nHello agent'
```
