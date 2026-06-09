---
name: check-agent-email
description: Discover, use, and check a private temporary Cloudflare Email Worker inbox through Cloudflare MCP. Use when Codex or Claude Code needs to find and enter an available agent email address, receive a verification link or code, wait for a reply, check email, inspect an agent inbox, summarize current mail, or retrieve a raw email.
---

# Check Agent Email

Use Cloudflare MCP first to discover the available coding-agent mailbox and its
backing resources. Do not assume a specific domain, account ID, database ID,
bucket name, or Worker name.

Find an active Email Routing rule whose literal recipient or name indicates an
agent or temporary inbox and whose action sends mail to a Worker. The literal
recipient matched by that rule is the address the agent can enter or provide
when a trusted workflow asks for an email address.

After entering or providing the address, complete the action that triggers the
email, then poll the inbox until the expected message arrives. Do not expose the
address unnecessarily, use it for unrelated subscriptions, or enter verification
codes and follow links without confirming they belong to the workflow in progress.

## Cloudflare MCP Workflow

1. Search the Cloudflare API specification for Email Routing rule-list endpoints.
2. List enabled Email Routing rules across available zones.
3. Identify the intended agent inbox rule and use its literal recipient as the
   temporary email address.
4. Discover D1 databases and R2 buckets whose names match the target Worker,
   mailbox, agent, email, or inbox.
5. Query the matching D1 database for current messages. Inspect its schema first
   when the table or columns are unknown.
6. Use the returned R2 object key to fetch complete parsed or raw content when
   needed.

Prefer read-only Cloudflare MCP operations. Do not create routes, send mail,
delete messages, or modify resources unless the user explicitly requests it.

## Workflow

1. Discover the available agent email address through Cloudflare MCP.
2. When a trusted workflow needs an email, enter or provide the discovered address.
3. Complete the action that should send the email.
4. Query the inbox. Poll briefly when waiting for an expected message.
5. If no rows are returned, report that the inbox is empty.
6. Summarize each current message using sender, subject, body preview, receipt time,
   and expiration time.
7. Fetch complete parsed or raw R2 content through Cloudflare MCP only when useful.

Do not delete messages unless the user explicitly requests deletion. Messages and
their index rows expire automatically after 24 hours.

When querying a discovered inbox with this project's schema, select:

```sql
SELECT id, received_at, expires_at, envelope_from, envelope_to, subject,
       text_body, raw_key, json_key
FROM emails
ORDER BY received_at DESC
```
