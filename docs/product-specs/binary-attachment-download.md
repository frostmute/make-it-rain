# Binary Attachment Download

**Status:** Shipped.

## User Story

> As a user who saves PDFs, EPUBs, and other file attachments to
> Raindrop, I want those files to be downloaded into my vault
> alongside the note, with the correct extension, so I can read them
> locally.

## Acceptance Criteria

- [x] When a raindrop's `link` field contains `/v2/` and `/file`, the
      plugin treats it as a binary attachment rather than a regular URL.
- [x] The plugin calls the authenticated Raindrop file-download endpoint.
- [x] When the response is an HTTP 303 redirect to S3, the plugin
      follows the redirect with the `Authorization` header **stripped**
      (S3 rejects pre-signed URLs with a Bearer token attached).
- [x] The file extension is derived from the HTTP `Content-Type` header
      and verified against the file's magic bytes.
- [x] Supported types: PDF, EPUB, common image formats (PNG, JPG, GIF,
      WebP), common video formats (MP4, WebM), common audio formats
      (MP3, OGG, WAV), generic documents.
- [x] On download failure, a debug file is written next to the note
      for troubleshooting.
- [x] The feature is toggleable in settings.
