# Suggested Prompt

Use authenticated Wrangler to deploy this repository as a private temporary
email inbox for a coding agent:

`https://github.com/andesco/agent-email-for-cloudflare`

Run `npm install`, verify authentication with `npx wrangler whoami`, and deploy
the included Worker with `npm run deploy`. Its binding-only configuration lets
Wrangler automatically provision and bind D1 and R2. Do not rebuild the Worker
from scratch or manually create those resources.

Use Wrangler's Email Routing commands to find a suitable domain with Email
Routing enabled and create a literal address for the agent. Route that address
to the deployed Worker.

If authenticated Wrangler is unavailable, direct the user to the repository's
**Deploy to Cloudflare** button as a user-assisted browser fallback.

After deployment:

1. Verify the Email Routing rule sends the chosen address to the Worker.
2. Verify the included Worker, automatically provisioned D1 database and R2
   bucket, and automatic 24-hour cleanup.
3. Use Cloudflare MCP to discover the deployed address and backing resources
   without relying on hardcoded account IDs, database IDs, bucket names, or domains.
4. Explain how a coding agent can enter or provide the discovered address, trigger
   an expected email, query D1 for current messages, and fetch complete parsed or
   raw content from R2 through Cloudflare MCP.
5. Install or use the repository's included Cloudflare MCP-only
   `check-agent-email` skill for Codex and Claude Code. The inbox-checking skill
   must not depend on Wrangler or local helper scripts.
