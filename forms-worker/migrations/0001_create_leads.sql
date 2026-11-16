-- SPDX-FileCopyrightText: 2025-2026 Refaqt (BE 0804.145.539) and contributors
-- SPDX-License-Identifier: CC-BY-SA-4.0
-- Database refaqt-leads (Cloudflare D1, EU jurisdiction).
-- Apply with: npx wrangler d1 migrations apply refaqt-leads --remote
-- Never edit this file after it ran. Add a new numbered file instead.

-- One row per form that a visitor sent.
CREATE TABLE leads (
  id          TEXT PRIMARY KEY,               -- random ID, also in the email to contact@refaqt.com
  created_at  TEXT NOT NULL,                  -- time in UTC, ISO 8601, for example 2026-11-16T10:30:00.000Z
  form        TEXT NOT NULL,                  -- 'home' (contact form) or 'aqtuator' (early access)
  name        TEXT NOT NULL DEFAULT '',       -- optional
  email       TEXT NOT NULL,
  interest    TEXT NOT NULL DEFAULT '',       -- the choice in "I want to"
  variant     TEXT NOT NULL DEFAULT '',       -- AQTUATOR CS travel, for example 'CS-360'
  message     TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT '',       -- two-letter country code from Cloudflare
  user_agent  TEXT NOT NULL DEFAULT '',       -- browser name, first 200 characters
  origin      TEXT NOT NULL DEFAULT '',       -- the site that sent the form, for example https://refaqt.com
  mail_status TEXT NOT NULL DEFAULT 'pending' -- 'sent', or what went wrong with the two emails
);

CREATE INDEX leads_created_at ON leads (created_at);

-- Short-lived counters for the limit per visitor. No IP address or email address is stored
-- here, only a hash of it. Rows older than one day are deleted on every new message.
CREATE TABLE form_hits (
  key TEXT NOT NULL,     -- 'ip:<hash>' or 'email:<hash>'
  at  INTEGER NOT NULL   -- time in milliseconds since 1970
);

CREATE INDEX form_hits_key_at ON form_hits (key, at);
