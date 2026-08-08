# Make It Rain regression test vault

This folder contains synthetic Markdown notes for manually testing the built
plugin in an isolated Obsidian vault. The fixtures contain no real Raindrop
content or credentials.

## Fixture expectations

| Note | Expected Safe Sync behavior |
| --- | --- |
| `01-current-default-id.md` | Detected through `id`, corroborated by its `source`/`type` fields |
| `02-legacy-snake-case.md` | Detected through `raindrop_id` |
| `03-legacy-camel-case.md` | Detected through `raindropId` and numeric conversion |
| `04-invalid-id.md` | Ignored because the ID is invalid |
| `05-no-id.md` | Ignored because no recognized ID exists |
| `06-multiple-ids.md` | Detected once, using `raindrop_id: 910000666` (explicit key preferred over `id`) |

A bare `id` field is only honored when the note also carries a Raindrop-emitted
field (`source`, `link`, `collectionId`, or `type`). This prevents notes from
other plugins that happen to use a numeric `id` from being captured for
destructive Safe Sync actions. The `raindrop_id` and `raindropId` keys are
always honored on their own.

The three valid IDs are deliberately synthetic. A live Safe Sync run will
classify them as unknown or deleted depending on the API response; do not use
a destructive action while testing them. Choose **Ignore** unless you are
intentionally testing the action flow on disposable copies.
