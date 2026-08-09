# Obsidian Regression Testing Guide

This guide validates the fixes for GitHub issues #87, #88, and #10 using the
built plugin and the synthetic notes in [`test-vault/`](../../test-vault/).

## Prerequisites

- Obsidian 1.13.4 or newer for the settings-page regression.
- Node.js and npm installed for building the plugin.
- A disposable Obsidian test vault. Do not use a production vault for Safe
  Sync action testing.
- A Raindrop.io API token only for live API tests (#10 and Safe Sync response
  classification). The token is entered in Obsidian plugin settings; it is not
  stored in this repository.

## 1. Build the plugin

From the repository root:

```bash
npm install
npm run build
```

Confirm that the build completes successfully and produces `main.js` in the
repository root. The build output is ignored by Git, which is expected.

## 2. Create or open the disposable test vault

1. Open Obsidian.
2. Choose **Open another vault → Create** or select an existing disposable
   vault.
3. Close Obsidian before copying plugin files into the vault.
4. Create this plugin directory inside the vault:

   ```text
   <vault>/.obsidian/plugins/make-it-rain/
   ```

5. Copy these built/runtime files from the repository into that directory:

   ```text
   main.js
   manifest.json
   styles.css        # copy only if present in your checkout/build output
   ```

6. Copy the contents of `test-vault/Make-It-Rain Regression/` into a folder
   named `Make-It-Rain Regression` at the root of the test vault.
7. Reopen Obsidian and enable **Make It Rain** under **Settings → Community
   plugins**.

Do not copy `node_modules`, source files, or repository credentials into the
vault.

## 3. Issue #87 — settings page regression

1. Open **Settings → Community plugins → Make It Rain**.
2. Confirm the page is populated rather than blank.
3. Confirm these sections are visible:
   - Connection & Core Setup
   - Import & Organization
   - Safe Sync & Cleanup
   - Template Engine
4. Change a harmless setting, such as **Show ribbon icon**.
5. Close settings, reopen settings, and confirm the value persisted.
6. Expand **Template Engine** and click the **Preview** button next to the default template or a content-type template to open the preview modal and confirm the template renders correctly.
7. If the page is blank or controls disappear, open **Help → Toggle developer
   tools**, inspect the Console, and record the first error and stack trace.

**Pass condition:** the plugin settings render through the normal Obsidian
settings-tab lifecycle and remain usable after reopening.

## 4. Issue #88 — Safe Sync frontmatter compatibility

### Scanner fixture check

1. In the test vault, open the **Make-It-Rain Regression** folder.
2. Confirm the six fixture notes are present.
3. In Make It Rain settings, enter a valid Raindrop token and set **Safe Sync
   default action** to **Prompt**.
4. Ensure **Enable safe sync** is on.
5. Run **Safe sync: scan for deleted/renamed Raindrops** from the command
   palette.
6. Confirm the results include these three valid candidates:
   - `01-current-default-id.md` — ID `910000001`
   - `02-legacy-snake-case.md` — ID `910000002`
   - `03-legacy-camel-case.md` — ID `910000003`
7. Confirm `06-multiple-ids.md` appears only once and uses ID `910000666`, the
   explicit `raindrop_id` value preferred over the generic `id`.
8. Confirm these notes are not listed:
   - `04-invalid-id.md`
   - `05-no-id.md`

A note whose only Raindrop-related field is a bare `id` (with no `source`,
`link`, `collectionId`, or `type`) is intentionally not detected, so notes from
other plugins are never captured. All six fixtures carry a corroborating field
except `05-no-id.md`, which has no ID at all.
9. Choose **Ignore** for all synthetic candidates and apply the actions.
10. Confirm no fixture note was deleted or moved.

The synthetic IDs are not expected to resolve to real Raindrops. That is useful
for testing the **Unknown** path, but it means you should not choose Delete or
Archive for these fixtures.

### Action-path check with disposable copies

To test the UI actions without risking useful notes:

1. Duplicate one fixture note and change its frontmatter to an ID you know is
   confirmed deleted in a disposable Raindrop account, or use a controlled API
   test/mocked response.
2. Run Safe Sync with **Prompt**.
3. Verify the confirmed-deleted row offers Ignore, Archive, and Delete.
4. Test **Archive** first and confirm the note moves to the configured trash
   folder with its content intact.
5. Repeat with another disposable copy for **Delete** only if permanent removal
   is intentionally being tested.
6. For an Unknown result, confirm the default action is Ignore and that no
   automatic destructive action occurs.

**Pass condition:** notes emitted with the current `id` key and notes using
legacy aliases are all discovered, invalid notes are ignored, and destructive
actions remain explicitly confirmed.

## 5. Issue #10 — highlight aggregation

1. In Raindrop.io, make sure you have at least two items with highlights and
   the same tag, for example `make-it-rain-regression`.
2. Include at least:
   - One item with multiple highlights.
   - One highlight with a note.
   - One item returned by the search that has no usable highlights, if your
     Raindrop account/API permits it.
3. In Obsidian, run **Aggregate highlights by tag**.
4. Enter the tag with a leading `#` and confirm it is accepted.
5. Choose a disposable output folder, such as `Make-It-Rain Regression/Output`.
6. Run the aggregation.
7. Confirm the generated note:
   - Is named `Aggregated Highlights - #<tag>.md`.
   - Contains a heading linked to each source URL.
   - Contains every highlight under its source.
   - Includes highlight notes where present.
   - Keeps multiline highlight text readable on one output line per highlight.
8. Run the same aggregation again.
9. Confirm the existing output is not overwritten; a timestamped note is
   created instead.
10. Run the command with a blank tag and confirm it reports the validation
    notice without making an API request or creating a note.
11. Run it with a tag that has no highlights and confirm no empty note is
    created.

**Pass condition:** the command searches with `#tag type:highlight`, handles
pagination, creates linked source sections, skips empty sources, preserves
existing output, and handles invalid/empty input safely.

## 6. Evidence to record

For each issue, record:

- Obsidian version and operating system.
- Plugin version from the settings footer.
- Test-vault path and fixture names used.
- Exact command or UI action performed.
- Resulting notice text.
- Output note path and a short excerpt, excluding API tokens.
- Any developer-console error and stack trace.

A fix is ready for release when the automated checks pass and the relevant
manual pass condition is satisfied on Obsidian 1.13.4 or newer.
