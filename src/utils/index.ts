/**
 * Utility Functions Index
 * ====================
 * 
 * This module serves as a centralized export point for all utility functions
 * used throughout the Make It Rain plugin. By consolidating exports here,
 * we can import all utilities from a single location, improving code organization
 * and reducing import complexity.
 * 
 * The utilities are organized into categories:
 * 
 * 1. File Utilities (fileUtils.ts)
 *    - Functions for file and folder operations within Obsidian's vault
 *    - Examples: doesPathExist, createFolder, sanitizeFileName
 * 
 * 2. API Utilities (apiUtils.ts)
 *    - Functions for interacting with Raindrop.io API
 *    - Examples: fetchWithRetry, createRateLimiter, handleRequestError
 * 
 * 3. YAML Utilities (yamlUtils.ts)
 *    - Functions for generating valid YAML frontmatter
 *    - Examples: createYamlFrontmatter, formatYamlValue, escapeYamlString
 * 
 * Usage:
 * ```typescript
 * import { 
 *   // File utilities
 *   doesPathExist, createFolder,
 *   // API utilities
 *   fetchWithRetry, createRateLimiter,
 *   // YAML utilities
 *   createYamlFrontmatter 
 * } from './utils';
 * ```
 */

// Re-export all file utilities
export {
    doesPathExist,
    isPathAFolder,
    createFolder,
    sanitizeFileName,
    createFolderStructure
} from './fileUtils';

// Re-export all API utilities
export type { RateLimiter } from './apiUtils';
export {
    createRateLimiter,
    createAuthenticatedRequestOptions,
    buildCollectionApiUrl,
    parseApiResponse,
    handleRequestError,
    fetchWithRetry,
    extractCollectionData
} from './apiUtils';

// Re-export all YAML utilities
export {
    isPlainObject,
    formatYamlValue,
    escapeYamlString,
    createYamlFrontmatter
} from './yamlUtils';
