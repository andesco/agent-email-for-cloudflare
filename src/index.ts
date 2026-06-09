import PostalMime from "postal-mime";
import { expiresAt, isExpired } from "./retention";

const MAX_INDEX_BODY_CHARS = 100_000;

type AttachmentSummary = {
  filename: string | null;
  mimeType: string;
  disposition: string | null;
  related: boolean;
  contentId: string | null;
  size: number;
};

type StoredEmail = {
  id: string;
  receivedAt: string;
  expiresAt: string;
  rawKey: string;
  envelope: {
    from: string;
    to: string;
  };
  headers: {
    messageId: string | null;
    inReplyTo: string | null;
    references: string | null;
    subject: string | null;
  };
  parsed: {
    from: unknown;
    to: unknown;
    cc: unknown;
    bcc: unknown;
    replyTo: unknown;
    subject: string | null;
    messageId: string | null;
    date: string | null;
    text: string | null;
    html: string | null;
    attachments: AttachmentSummary[];
  };
};

function attachmentSummary(attachment: {
  filename?: string | null;
  mimeType: string;
  disposition?: string | null;
  related?: boolean;
  contentId?: string | null;
  content: string | ArrayBuffer | Uint8Array;
}): AttachmentSummary {
  return {
    filename: attachment.filename ?? null,
    mimeType: attachment.mimeType,
    disposition: attachment.disposition ?? null,
    related: attachment.related ?? false,
    contentId: attachment.contentId ?? null,
    size: typeof attachment.content === "string"
      ? new TextEncoder().encode(attachment.content).byteLength
      : attachment.content.byteLength,
  };
}

function indexPreview(value: string | null): string | null {
  return value === null ? null : value.slice(0, MAX_INDEX_BODY_CHARS);
}

async function ensureSchema(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        received_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        envelope_from TEXT NOT NULL,
        envelope_to TEXT NOT NULL,
        subject TEXT,
        text_body TEXT,
        html_body TEXT,
        raw_key TEXT NOT NULL,
        json_key TEXT NOT NULL
      )`,
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS emails_received_at_idx ON emails(received_at DESC)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS emails_expires_at_idx ON emails(expires_at)",
    ),
  ]);
}

async function storeEmail(message: ForwardableEmailMessage, env: Env): Promise<void> {
  await ensureSchema(env);

  const receivedAt = new Date();
  const expiration = expiresAt(receivedAt);
  const id = crypto.randomUUID();
  const prefix = `messages/${receivedAt.toISOString().replaceAll(":", "-")}-${id}`;
  const rawKey = `${prefix}.eml`;
  const jsonKey = `${prefix}.json`;
  const raw = await new Response(message.raw).arrayBuffer();
  const parsed = await PostalMime.parse(raw);

  const stored: StoredEmail = {
    id,
    receivedAt: receivedAt.toISOString(),
    expiresAt: expiration.toISOString(),
    rawKey,
    envelope: {
      from: message.from,
      to: message.to,
    },
    headers: {
      messageId: message.headers.get("message-id"),
      inReplyTo: message.headers.get("in-reply-to"),
      references: message.headers.get("references"),
      subject: message.headers.get("subject"),
    },
    parsed: {
      from: parsed.from ?? null,
      to: parsed.to ?? null,
      cc: parsed.cc ?? null,
      bcc: parsed.bcc ?? null,
      replyTo: parsed.replyTo ?? null,
      subject: parsed.subject ?? null,
      messageId: parsed.messageId ?? null,
      date: parsed.date ?? null,
      text: parsed.text ?? null,
      html: parsed.html ?? null,
      attachments: parsed.attachments.map(attachmentSummary),
    },
  };

  const customMetadata = {
    "received-at": stored.receivedAt,
    "expires-at": stored.expiresAt,
  };

  await Promise.all([
    env.INBOX.put(rawKey, raw, {
      httpMetadata: { contentType: "message/rfc822" },
      customMetadata,
    }),
    env.INBOX.put(jsonKey, JSON.stringify(stored, null, 2), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata,
    }),
  ]);

  await env.DB.prepare(
    `INSERT INTO emails (
      id, received_at, expires_at, envelope_from, envelope_to, subject,
      text_body, html_body, raw_key, json_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    stored.id,
    stored.receivedAt,
    stored.expiresAt,
    stored.envelope.from,
    stored.envelope.to,
    stored.parsed.subject ?? stored.headers.subject,
    indexPreview(stored.parsed.text),
    indexPreview(stored.parsed.html),
    rawKey,
    jsonKey,
  ).run();

  console.log(JSON.stringify({
    event: "email_stored",
    id,
    from: message.from,
    to: message.to,
    rawSize: message.rawSize,
    expiresAt: stored.expiresAt,
    rawKey,
    jsonKey,
  }));
}

async function deleteExpired(env: Env, now: Date): Promise<number> {
  await ensureSchema(env);

  let cursor: string | undefined;
  let deleted = 0;

  do {
    const page = await env.INBOX.list({
      prefix: "messages/",
      cursor,
      limit: 1000,
    });
    const expiredKeys = page.objects
      .filter((object) => isExpired(object.uploaded, now))
      .map((object) => object.key);

    if (expiredKeys.length > 0) {
      await env.INBOX.delete(expiredKeys);
      deleted += expiredKeys.length;
    }

    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  await env.DB.prepare("DELETE FROM emails WHERE expires_at <= ?")
    .bind(now.toISOString())
    .run();

  return deleted;
}

export default {
  async email(message, env): Promise<void> {
    await storeEmail(message, env);
  },

  async scheduled(_controller, env): Promise<void> {
    const deleted = await deleteExpired(env, new Date());
    console.log(JSON.stringify({ event: "expired_email_cleanup", deleted }));
  },
} satisfies ExportedHandler<Env>;
