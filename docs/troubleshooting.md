# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Make It Rain plugin.

## API Connection Issues

### Invalid API Token

**Symptoms:**

- Error message: "Invalid API token" or "Unauthorized"
- Unable to fetch any raindrops
- Token verification fails

**Solutions:**

1. Double-check your API token for typos or extra spaces
2. Generate a new token from [Raindrop.io Integrations](https://app.raindrop.io/settings/integrations)
3. Ensure you're using the Test Token, not the App ID or Secret
4. Verify your Raindrop.io account is active and in good standing

### Rate Limiting

**Symptoms:**

- Error message: "Rate limit exceeded"
- Fetching stops midway
- Multiple "Waiting for rate limit" notices

**Solutions:**

1. The plugin automatically handles rate limits with waiting periods
2. For large collections, break imports into smaller batches
3. Wait a few minutes before trying again
4. If persistent, try fetching during off-peak hours

### Network Connectivity

**Symptoms:**

- Error message: "Network error" or "Failed to fetch"
- Inconsistent connection to Raindrop.io API

**Solutions:**

1. Check your internet connection
2. Verify that Raindrop.io is accessible in your browser
3. If using a VPN or firewall, ensure it allows connections to Raindrop.io
4. Try again later if Raindrop.io might be experiencing downtime

## Note Generation Issues

### Filename Conflicts

**Symptoms:**

- Error message about duplicate filenames
- Some notes not being created

**Solutions:**

1. Enable "Use Raindrop ID for File Name" in the fetch modal
2. Modify your filename template to include unique identifiers (e.g., `{{id}}-{{title}}`)
3. Use the "Update Existing Notes" option to overwrite existing files

### Missing Content

**Symptoms:**

- Notes created but missing expected content
- Incomplete information in notes

**Solutions:**

1. Check if the content exists in Raindrop.io (some raindrops may have limited data)
2. Verify your template is correctly formatted (if using the template system)
3. Try updating the notes to refresh the content
4. For highlights, ensure they exist in the original raindrop

### Malformed Frontmatter

**Symptoms:**

- Obsidian shows errors in note properties
- YAML parsing errors

**Solutions:**

1. Check for special characters in your raindrop titles or tags that might break YAML
2. If using custom templates, ensure proper YAML formatting
3. Try recreating the affected notes with simpler content

## Collection and Folder Issues

### Missing Collections

**Symptoms:**

- Some collections don't appear in the folder structure
- Unable to filter by certain collections

**Solutions:**

1. Verify the collections exist in your Raindrop.io account
2. Check for typos in collection names/IDs in the filter
3. Ensure you have access to the collections (especially for shared collections)
4. Try using collection IDs instead of names for more reliable filtering

### Incorrect Folder Hierarchy

**Symptoms:**

- Folders not nested correctly
- Flat structure instead of hierarchical

**Solutions:**

1. Ensure "Include Subcollections" is enabled in the fetch modal
2. Verify your collection hierarchy in Raindrop.io
3. Try fetching from a specific parent collection rather than "All Collections"

## Template System Issues

### Templates Not Applied

**Symptoms:**

- Notes don't follow your custom template format
- Default formatting is used instead

**Solutions:**

1. Verify that "Enable Template System" is turned on in settings
2. Check that you've saved your template changes
3. Ensure you've selected the correct template in the fetch modal
4. Verify template syntax for errors

### Template Syntax Errors

**Symptoms:**

- Error messages about template processing
- Malformed content in notes

**Solutions:**

1. Check your template for syntax errors (missing brackets, etc.)
2. Verify variable names match those in the [documentation](template-system.md#available-variables)
3. Test with the default template first, then gradually add customizations
4. For complex templates, break them down into smaller parts to identify issues

## Performance Issues

### Slow Fetching

**Symptoms:**

- Fetching takes a very long time
- Plugin seems unresponsive

**Solutions:**

1. This is normal for large collections due to API rate limiting
2. Use more specific filters to reduce the number of raindrops fetched
3. Break large imports into smaller batches
4. Be patient - the plugin is designed to work within Raindrop.io's rate limits

### Obsidian Freezing

**Symptoms:**

- Obsidian becomes unresponsive during fetching
- High CPU usage

**Solutions:**

1. Fetch smaller batches of raindrops
2. Close other resource-intensive plugins during fetching
3. Restart Obsidian and try again
4. Update to the latest version of the plugin and Obsidian

## Plugin Update Issues

### Plugin Not Working After Update

**Symptoms:**

- Features stop working after updating
- Error messages after update

**Solutions:**

1. Restart Obsidian completely
2. Check for compatibility issues with your Obsidian version
3. Verify settings were preserved during update
4. As a last resort, uninstall and reinstall the plugin

## Getting More Help

If you're still experiencing issues:

1. Check the [GitHub repository](https://github.com/frostmute/make-it-rain) for known issues
2. Look for similar problems in the [Issues section](https://github.com/frostmute/make-it-rain/issues)
3. Create a new issue with:
   - A clear description of the problem
   - Steps to reproduce
   - Your Obsidian version
   - Your plugin version
   - Any error messages (exact text)
   - Screenshots if applicable

The developer is active and responsive to bug reports and feature requests.
