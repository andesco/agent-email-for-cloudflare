# Agent Email for Cloudflare

**Agent Email for Cloudflare** gives coding agents a private, temporary email address they can enter during trusted workflows and check through Cloudflare MCP.

Incoming messages are indexed in [Cloudflare D1][d1] and stored as complete parsed and raw messages in [Cloudflare R2][r2]. A scheduled Worker deletes messages after 24 hours. The inbox has no public HTTP endpoint.

## Deploy to Cloudflare

### Cloudflare Dashboard

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/agent-email-for-cloudflare)

Workers & Pages → [**Create application**](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/deploy-to-workers): Continue with GitHub: Clone a public repository via Git URL:

```text
https://github.com/andesco/agent-email-for-cloudflare
```

Enable Email Routing on a domain if it is not already enabled. This changes the domain’s mail routing so review the generated DNS records first. Create an email address for your agent:

1. Email → [**Email Routing**](https://dash.cloudflare.com/?to=/:account/:zone/email-service/routing/routes/): Routing rules
2. Create a custom address, for example: `agent@example.com`
3. Choose **Send to a Worker**, select `agent-email-for-cloudflare` and save.

### Wrangler CLI

```bash
git clone https://github.com/andesco/agent-email-for-cloudflare.git
cd agent-email-for-cloudflare
npm install
npx wrangler whoami
npm run deploy
```

Using a domain that already has Email Routing enabled, create an email address for your agent:

```bash
npx wrangler email routing list

EMAIL_ADDRESS=agent@example.com
DOMAIN="${EMAIL_ADDRESS#*@}"

npx wrangler email routing rules create "$DOMAIN" \
  --name "$EMAIL_ADDRESS temporary inbox" \
  --match-type literal \
  --match-field to \
  --match-value "$EMAIL_ADDRESS" \
  --action-type worker \
  --action-value agent-email-for-cloudflare

npx wrangler email routing rules list "$DOMAIN"
```

> [!IMPORTANT]
> If the chosen domain is not listed, review the DNS impact before enabling Email Routing: \
> `npx wrangler email routing enable "$DOMAIN"`.

### Suggested Prompt

```text
Use authenticated `wrangler` CLI to deploy this repository to Cloudflare Workers as a private temporary email inbox for a coding agent:

https://github.com/andesco/agent-email-for-cloudflare

Clone the repository, run npm install, verify authentication with `npx wrangler whoami`, and deploy the included Cloudflare Worker with npm run deploy. Let Wrangler automatically provision and bind D1 and R2. Do not rebuild the Worker from scratch or manually create those resources.

Use `npx wrangler email routing list` to find a suitable domain with Email Routing enabled, ask the user for the full email address if one was not provided, and use `npx wrangler email routing rules create` to create a literal address routed to the deployed Worker. Do not enable Email Routing on a domain without user confirmation because doing so changes its mail routing.

After deployment:

1. Verify the Email Routing rule sends the chosen address to the Worker.
2. Verify the Worker, automatically provisioned D1 database and R2 bucket, and automatic 24-hour cleanup.
3. Use Cloudflare MCP to discover the deployed address and backing resources without relying on hardcoded account IDs, database IDs, bucket names, or domains.
4. Explain how a coding agent can enter or provide the discovered address, trigger an expected email, query D1 for current messages, and fetch complete parsed or raw content from R2 through Cloudflare MCP.
5. Install or use the repository’s included `check-agent-email` skill to guide Codex and Claude Code in the use of Cloudflare MCP to check and read email.
```


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
