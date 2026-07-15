# Product Sense

> Who the user is, what they care about, what we optimize for, and
> what we explicitly don't. This is the working theory behind the
> product decisions in `docs/product-specs/`. Update it when the
> target user or the core loop changes.

## Who the User Is

A person who:

- Uses **Obsidian** as their primary knowledge tool. They think in
  notes, links, tags, and graph views. Their vault is a long-term
  asset.
- Uses **Raindrop.io** to capture things on the go (web, mobile share
  sheet, browser extension). They may not curate aggressively in
  Raindrop itself — it's a capture buffer.
- Has accumulated **hundreds to tens of thousands** of bookmarks and
  wants to bring them under the same roof as their notes, where they
  can search, link, and re-discover.
- Values **local ownership** of their data. They may have a backup
  strategy for their vault; they are not necessarily comfortable with
  cloud-only storage for their reading list.

## Core Loop

```
[Capture in Raindrop] → [Import into Obsidian] → [Read, link, re-surface in Obsidian]
```

The user captures on whatever device is in their hand. When they're
ready — usually at a desktop — they fire up Make It Rain, choose
what to import, and let the plugin do the structural work. Once in
Obsidian, the note is just a note: searchable, linkable, graph-able.

## Mental Model

The user thinks of the imported note as **their note**, not "a
Raindrop export." The Raindrop origin is metadata, not the source of
truth. After import, the note can be edited, renamed, moved, or
deleted without asking Raindrop's permission.

This is the key reason we are a **one-way import tool**, not a sync
tool: the user wants to *own* the artifact, not maintain a permanent
remote reference to it.

## What We Optimize For

1. **Fidelity of import.** A note written by Make It Rain should look
   like a hand-crafted note: clean frontmatter, sensible body, working
   wiki-links, correct file type for attachments.
2. **Predictability.** The user should be able to look at a template
   and know what a note will look like before clicking import. No
   magic, no hidden post-processing.
3. **Robustness over speed.** A batch import that survives a flaky
   network beats one that's 30% faster but bails on the first 429.
4. **User control over path layout.** The user picks the root folder;
   the plugin derives sub-paths from Raindrop's Group → Collection
   tree, but the root is theirs.

## What We Explicitly Don't Optimize For

1. **Live sync.** The plugin does not poll Raindrop. It does not push
   edits back. The user runs imports when they want them.
2. **Curation intelligence.** No AI tagging, no AI summary, no
   "related bookmarks" suggestions. The user curates.
3. **Plugin marketplace breadth.** This is a single plugin, not a
   platform. There is no public API for third-party integrations.
4. **Mobile-first UX.** The plugin runs on mobile Obsidian too, but
   the heavy workflows (bulk import, safe-sync review) target
   desktop.

## Prioritization Heuristics

When choosing what to build next:

- **Does it remove a manual step the user does every import?** High
  priority.
- **Does it make an existing step less error-prone?** High priority.
- **Does it add a new "kind" of bookmark the user can import?**
  Medium — only if that kind is already on Raindrop's roadmap or
  has user demand.
- **Does it make the plugin prettier or add UI polish to a working
  flow?** Low — only after the data is right.
- **Does it require a new third-party dependency?** Treat as a
  non-trivial cost; justify it.

## Decisions That Are Off The Table

These come up occasionally and are deliberately declined. They're
documented here so a future contributor doesn't waste time proposing
them.

- "Why not just two-way sync with Raindrop?" — see the Core Loop
  above. We are a one-way import tool by design.
- "Why not auto-archive old notes on the web?" — local ownership;
  the user decides.
- "Why not an LLM pass to summarize highlights?" — out of scope; the
  user curates.
