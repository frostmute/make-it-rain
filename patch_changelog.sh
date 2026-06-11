#!/bin/bash
awk '
/^## \[1.10.0\]/ {
    print "## [1.11.0] - '"$(date +%Y-%m-%d)"'"
    print ""
    print "### Fixed"
    print ""
    print "- **Community Review Resolutions**: Addressed all final warnings and suggestions from the Obsidian plugin community review (Issues #78-#80)."
    print "  - Replaced type `any` assertions with strong structural type checking."
    print "  - Enforced stricter type safety for loaded settings and object assignments."
    print "  - Addressed floating promises in modals."
    print "  - Fixed synchronous UI rendering behaviors."
    print "- **Performance Optimizations**: "
    print "  - Optimized regex instantiation in `securityUtils.ts`."
    print "  - Improved `decodeHTMLEntity` execution speed."
    print ""
}
{ print }
' CHANGELOG.md > CHANGELOG_NEW.md && mv CHANGELOG_NEW.md CHANGELOG.md
