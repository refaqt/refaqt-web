# Agent guide

Start here if you are an agent (Cursor, Claude Code, or similar) working in this repository.

## First step (required)

Check the tooling folder before anything else. Run this from the repository root:

```bash
ls .agents/rules/core.md
```

- **The file is there.** The folder is filled. Go on to [Shared kit](#shared-kit).
- **The file is missing.** Run `bash setup-agents.sh` from the repository root, then check again.

A `SessionStart` hook at [`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh) does the
same work at the start of a session, and prints one line when it worked. Do not trust it blindly. It
runs only when the session opens **this folder** as its project folder. Claude Code reads
`.claude/settings.json` from that folder only, so a session that opens a parent folder, or that
attaches several repositories at once, never reads the file, never starts the hook, and prints
nothing at all. Silence and success look the same. The check above is the only step that works in
every session.

Run the setup file anyway when the hook said it could not reach the network. `.agents/` follows the
`main` branch of refaqt-agents, so it moves ahead of the commit this repository records. That is the
update working. `.gitmodules` sets `ignore = all`, so `git status` stays quiet about it. Never put the
folder back on the recorded commit. To set a new pin on purpose: `git add --force .agents`. Installing the kit in a new repo:
[`.agents/INSTALL.md`](.agents/INSTALL.md).

## Shared kit

This repo mounts [refaqt/refaqt-agents](https://github.com/refaqt/refaqt-agents) at [`.agents/`](.agents/).

1. Read [`.agents/rules/core.md`](.agents/rules/core.md), [`.agents/rules/communication.md`](.agents/rules/communication.md), [`.agents/rules/reporting.md`](.agents/rules/reporting.md), and [`.agents/rules/living-docs.md`](.agents/rules/living-docs.md).
2. Read [`docs/mistakes/`](docs/mistakes/) and say which prevention rules apply.
3. Read [`docs/architecture.md`](docs/architecture.md) before larger work.

Write every reply and every file in B2 English. Follow `.agents/rules/communication.md`.
Write pull requests, commit messages, GitHub comments, issues, and log entries for a manager, not
for a developer. Follow `.agents/rules/reporting.md`.
The pull request box starts with the right headings: [`.github/pull_request_template.md`](.github/pull_request_template.md).

## This repository

The REFAQT website, built as a GitHub Pages site. The home page is at the root. Each product has
its own folder: the AQTUATOR CS site is in [`aqtuator/`](aqtuator/). Repo profile and conventions:
[`.agents-local/rules/repo.md`](.agents-local/rules/repo.md). Map: [`docs/architecture.md`](docs/architecture.md).

This is not a hardware repository. It has no `doqs/` submodule. Use `bash setup-agents.sh`, never
`setup-tooling.sh`.

| You are adding | It goes in |
| --- | --- |
| A day's work write-up | `docs/log/YYYY-MM-DD_topic.md` |
| Why a choice was made | `docs/decisions/YYYY-MM-DD_topic.md` |
| Something that went wrong | `docs/mistakes/YYYY-MM-DD_topic.md` |

Skills that belong only to this repo: `.agents-local/skills/`. Read `.agents-local/skills/patterns/SKILL.md` before you change the machine pictures in `tools/`.

## Skills

| Skill | Path |
| --- | --- |
| Activity log | `.agents/skills/log/SKILL.md` |
| Mistake log | `.agents/skills/mistake-log/SKILL.md` |
| Maintain patterns | `.agents/skills/maintain-patterns/SKILL.md` |
