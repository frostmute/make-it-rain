#!/bin/bash

# Make It Rain - Repository Cleanup Script
# ==========================================
# This script cleans up the repository structure by:
# - Moving duplicate release notes to docs/release-notes/
# - Archiving temporary documentation to docs/meta/
# - Checking for obsolete patch files
# - Adding placeholders for empty directories

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run     Show what would be done without making changes"
            echo "  -v, --verbose Show detailed output"
            echo "  -h, --help    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Helper functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "  $1"
    fi
}

execute() {
    local cmd="$1"
    local desc="$2"

    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} $desc"
        print_info "Would execute: $cmd"
    else
        print_info "Executing: $cmd"
        eval "$cmd"
        print_success "$desc"
    fi
}

# Main cleanup logic
main() {
    print_header "Make It Rain - Repository Cleanup"

    if [ "$DRY_RUN" = true ]; then
        print_warning "Running in DRY RUN mode - no changes will be made"
    fi

    # Check we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "README.md" ]; then
        print_error "This script must be run from the repository root"
        exit 1
    fi

    # Create backup branch
    print_header "Step 1: Create Backup Branch"
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "none")

    if [ "$current_branch" = "none" ]; then
        print_warning "Not in a git repository - skipping branch creation"
    else
        print_info "Current branch: $current_branch"

        if [ "$DRY_RUN" = false ]; then
            read -p "Create backup branch 'cleanup-repo'? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git checkout -b cleanup-repo 2>/dev/null || print_warning "Branch cleanup-repo may already exist"
                print_success "Created/switched to cleanup-repo branch"
            fi
        else
            print_info "Would create branch: cleanup-repo"
        fi
    fi

    # Phase 1: Move release notes
    print_header "Step 2: Move Duplicate Release Notes"

    if [ -f "release-notes-1.7.1.md" ]; then
        execute "mv release-notes-1.7.1.md docs/release-notes/" "Move release-notes-1.7.1.md"
    else
        print_info "release-notes-1.7.1.md not found (may already be moved)"
    fi

    if [ -f "release-notes-1.7.2.md" ]; then
        execute "mv release-notes-1.7.2.md docs/release-notes/" "Move release-notes-1.7.2.md"
    else
        print_info "release-notes-1.7.2.md not found (may already be moved)"
    fi

    # Phase 2: Create meta docs folder and move temporary docs
    print_header "Step 3: Archive Temporary Documentation"

    execute "mkdir -p docs/meta" "Create docs/meta directory"

    if [ -f "FILES_CREATED.md" ]; then
        execute "mv FILES_CREATED.md docs/meta/" "Move FILES_CREATED.md to docs/meta/"
    else
        print_info "FILES_CREATED.md not found (may already be moved)"
    fi

    if [ -f "TESTING_SETUP_COMPLETE.md" ]; then
        execute "mv TESTING_SETUP_COMPLETE.md docs/meta/" "Move TESTING_SETUP_COMPLETE.md to docs/meta/"
    else
        print_info "TESTING_SETUP_COMPLETE.md not found (may already be moved)"
    fi

    # Phase 3: Check for obsolete patch file
    print_header "Step 4: Check Obsolete Patch File"

    if [ -f "scripts/fix-json-parsing.patch" ]; then
        # Check if patch is applied
        patch_applied=$(grep -c "as CollectionResponse" src/main.ts 2>/dev/null || echo "0")

        if [ "$patch_applied" -gt 0 ]; then
            print_warning "Patch appears to be applied (found $patch_applied occurrences)"

            if [ "$DRY_RUN" = false ]; then
                read -p "Delete obsolete patch file? (y/N) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    execute "rm scripts/fix-json-parsing.patch" "Remove obsolete patch file"
                else
                    print_info "Keeping patch file"
                fi
            else
                print_info "Would ask to delete patch file"
            fi
        else
            print_info "Patch may not be applied - keeping patch file"
        fi
    else
        print_info "Patch file not found (may already be removed)"
    fi

    # Phase 4: Add integration test placeholder
    print_header "Step 5: Add Integration Test Placeholder"

    if [ ! -f "tests/integration/README.md" ] && [ ! -f "tests/integration/.gitkeep" ]; then
        execute "cat > tests/integration/README.md << 'EOF'
# Integration Tests

This directory will contain integration tests for the Make It Rain plugin.

## Planned Tests

- [ ] Full raindrop import workflow
- [ ] Template processing end-to-end
- [ ] Settings management
- [ ] Modal interactions

## Running Integration Tests

\`\`\`bash
npm run test:integration
\`\`\`

Integration tests are not yet implemented. Contributions welcome!
EOF" "Create integration test README"
    else
        print_info "Integration test placeholder already exists"
    fi

    # Phase 5: Asset audit (informational only)
    print_header "Step 6: Asset Usage Audit"

    print_info "Checking which assets are referenced in documentation..."

    if [ -d "assets" ]; then
        for ext in png webp jpg; do
            for asset in assets/*.$ext; do
                if [ -f "$asset" ]; then
                    asset_name=$(basename "$asset")
                    references=$(grep -r "$asset_name" . --include="*.md" 2>/dev/null | wc -l)

                    if [ "$references" -eq 0 ]; then
                        print_warning "Unused: $asset_name (0 references)"
                    else
                        print_success "Used: $asset_name ($references references)"
                    fi
                fi
            done
        done
    fi

    # Summary
    print_header "Cleanup Summary"

    echo "Files moved:"
    echo "  • release-notes-1.7.1.md → docs/release-notes/"
    echo "  • release-notes-1.7.2.md → docs/release-notes/"
    echo "  • FILES_CREATED.md → docs/meta/"
    echo "  • TESTING_SETUP_COMPLETE.md → docs/meta/"
    echo ""
    echo "Directories created:"
    echo "  • docs/meta/"
    echo "  • tests/integration/ (with README)"
    echo ""

    if [ "$DRY_RUN" = false ]; then
        print_success "Cleanup complete!"
        echo ""
        echo "Next steps:"
        echo "  1. Review changes: git status"
        echo "  2. Test build: npm run build"
        echo "  3. Test suite: npm test"
        echo "  4. Commit changes: git add -A && git commit -m 'chore: cleanup repository structure'"
        echo ""
        echo "See docs/meta/CLEANUP_PLAN.md for additional optional cleanup steps."
    else
        print_warning "DRY RUN complete - no changes were made"
        echo ""
        echo "Run without --dry-run to apply changes:"
        echo "  bash cleanup.sh"
    fi
}

# Run main function
main

exit 0
