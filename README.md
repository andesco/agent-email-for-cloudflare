# Agent Email for Cloudflare

**Agent Email for Cloudflare** gives coding agents a private, temporary email
address they can enter during trusted workflows and check through Cloudflare MCP.

Incoming messages are indexed in [Cloudflare D1][d1] and stored as complete
parsed and raw messages in [Cloudflare R2][r2]. A scheduled Worker deletes
messages after 24 hours. The inbox has no public HTTP endpoint.

## Deploy

### Option 1: Coding Agent

Give this prompt to a coding agent with authenticated [Wrangler][wrangler] and
[Cloudflare MCP][cloudflare-mcp] access:

```text
Deploy https://github.com/andesco/agent-email-for-cloudflare as a private
temporary email inbox.

Use authenticated Wrangler to clone and deploy the included Worker. Let Wrangler
automatically provision and bind D1 and R2. Use Wrangler Email Routing commands
to find a suitable enabled domain, create a literal agent email address, and
route it to the Worker.

After deployment, verify the Worker, routing rule, D1/R2 bindings, and 24-hour
cleanup. Then use Cloudflare MCP to discover the mailbox and backing resources,
query current messages in D1, and fetch complete parsed or raw messages from R2.
Use the repository's included check-agent-email skill for future inbox checks.
```

Wrangler handles deployment, automatic resource provisioning, and [Email
Routing][email-routing] setup. Cloudflare MCP handles mailbox discovery and
reading messages.

### Option 2: Deploy to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/agent-email-for-cloudflare)

This user-assisted browser flow creates a copy of the repository, deploys the
Worker, and automatically provisions D1 and R2. After deployment, configure a
literal Email Routing address to send mail to the Worker.

### Option 3: Manual Deployment

```bash
git clone https://github.com/andesco/agent-email-for-cloudflare.git
cd agent-email-for-cloudflare
npm install
npx wrangler whoami
npm run deploy
```

Wrangler automatically provisions the D1 and R2 bindings. Then create a literal
Email Routing address and route it to `agent-email-for-cloudflare`.

## How It Works

- **Email Worker:** receives and parses mail sent through Cloudflare Email Routing.
- **D1:** indexes sender, recipient, subject, body preview, object keys, and expiry.
- **R2:** privately stores parsed `.json` and raw RFC 822 `.eml` messages.
- **Cron Trigger:** runs every minute and deletes messages older than 24 hours.
- **Cloudflare MCP:** discovers the mailbox and reads D1/R2 without a public inbox.

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

[cloudflare-mcp]: https://github.com/cloudflare/mcp
[d1]: https://developers.cloudflare.com/d1/
[email-routing]: https://developers.cloudflare.com/email-routing/
[r2]: https://developers.cloudflare.com/r2/
[wrangler]: https://developers.cloudflare.com/workers/wrangler/
