# API Reference

This document provides detailed technical documentation for the Make It Rain plugin's API and internal interfaces.

## Table of Contents

- [Core Interfaces](#core-interfaces)
- [Service APIs](#service-apis)
- [Template System](#template-system)
- [Event System](#event-system)
- [Utility Functions](#utility-functions)

## Core Interfaces

### RaindropItem

```typescript
interface RaindropItem {
    id: number;
    title: string;
    url: string;
    created: string;
    updated: string;
    type: RaindropType;
    cover?: string;
    excerpt?: string;
    note?: string;
    tags: string[];
    highlights: Highlight[];
    collection: Collection;
    media: Media[];
    important: boolean;
    broken: boolean;
    canEdit: boolean;
    lastUpdate: string;
    domain: string;
    creatorRef: CreatorRef;
    sort: number;
    collectionId: number;
    user: User;
}
```

### Collection

```typescript
interface Collection {
    id: number;
    title: string;
    parent_id?: number;
    path: string;
    count: number;
    created: string;
    updated: string;
    user: User;
    cover?: string[];
    view: string;
    sort: number;
    expanded: boolean;
    public: boolean;
    type: string;
    description?: string;
}
```

### TemplateConfig

```typescript
interface TemplateConfig {
    name: string;
    content: string;
    variables: string[];
    type?: RaindropType;
    collectionId?: number;
}
```

## Service APIs

### RaindropService

```typescript
class RaindropService {
    // Authentication
    setToken(token: string): void;
    validateToken(): Promise<boolean>;
    
    // Collections
    getCollections(): Promise<Collection[]>;
    getCollection(id: number): Promise<Collection>;
    getCollectionItems(id: number, options?: FetchOptions): Promise<RaindropItem[]>;
    
    // Items
    getItem(id: number): Promise<RaindropItem>;
    searchItems(query: string, options?: SearchOptions): Promise<RaindropItem[]>;
    
    // Rate Limiting
    getRateLimit(): Promise<RateLimit>;
    handleRateLimit(): Promise<void>;
}
```

### TemplateService

```typescript
class TemplateService {
    // Template Management
    registerTemplate(config: TemplateConfig): void;
    getTemplate(type: RaindropType, collectionId?: number): string;
    validateTemplate(template: string): ValidationResult;
    
    // Template Processing
    processTemplate(template: string, data: any): string;
    previewTemplate(template: string, data: any): string;
    
    // Helper Functions
    registerHelper(name: string, fn: Function): void;
    registerHelpers(helpers: Record<string, Function>): void;
}
```

### ImportService

```typescript
class ImportService {
    // Import Operations
    importItems(items: RaindropItem[], options: ImportOptions): Promise<void>;
    updateItems(items: RaindropItem[], options: UpdateOptions): Promise<void>;
    
    // File Management
    createNote(item: RaindropItem, template: string): Promise<void>;
    updateNote(item: RaindropItem, template: string): Promise<void>;
    deleteNote(item: RaindropItem): Promise<void>;
    
    // Progress Tracking
    onProgress(callback: (progress: ImportProgress) => void): void;
    onComplete(callback: (result: ImportResult) => void): void;
    onError(callback: (error: Error) => void): void;
}
```

## Template System

### Built-in Helpers

#### Date Formatting

```typescript
// Format date to ISO string
formatDateISO(date: Date): string;

// Format date to locale string
formatDate(date: Date, format?: string): string;

// Format time to locale string
formatTime(date: Date): string;

// Get relative time
relativeTime(date: Date): string;
```

#### Text Manipulation

```typescript
// Sanitize text for Obsidian
sanitize(text: string): string;

// Truncate text to length
truncate(text: string, length: number): string;

// Convert to title case
titleCase(text: string): string;
```

#### Array Operations

```typescript
// Join array elements
join(array: any[], separator?: string): string;

// Get array length
length(array: any[]): number;

// Get first element
first(array: any[]): any;

// Get last element
last(array: any[]): any;
```

#### Conditional Helpers

```typescript
// Check if value exists
exists(value: any): boolean;

// Check if array is empty
isEmpty(array: any[]): boolean;

// Check if string is empty
isBlank(text: string): boolean;
```

#### Raindrop-specific Helpers

```typescript
// Get Raindrop type
raindropType(type: string): string;

// Check if has highlights
hasHighlights(item: RaindropItem): boolean;

// Check if has tags
hasTags(item: RaindropItem): boolean;

// Format tags
formatTags(tags: string[]): string;

// Format highlights
formatHighlights(highlights: Highlight[]): string;
```

## Event System

### Event Types

```typescript
enum PluginEventType {
    IMPORT_START = 'import:start',
    IMPORT_PROGRESS = 'import:progress',
    IMPORT_COMPLETE = 'import:complete',
    IMPORT_ERROR = 'import:error',
    TEMPLATE_VALIDATE = 'template:validate',
    TEMPLATE_ERROR = 'template:error',
    SETTINGS_CHANGE = 'settings:change',
    API_ERROR = 'api:error'
}
```

### Event Handlers

```typescript
interface EventHandler {
    (event: PluginEvent): void;
}

class EventManager {
    on(type: PluginEventType, handler: EventHandler): void;
    off(type: PluginEventType, handler: EventHandler): void;
    emit(type: PluginEventType, data: any): void;
}
```

## Utility Functions

### File Operations

```typescript
// Create directory if not exists
createDirectory(path: string): Promise<void>;

// Check if file exists
fileExists(path: string): Promise<boolean>;

// Read file content
readFile(path: string): Promise<string>;

// Write file content
writeFile(path: string, content: string): Promise<void>;

// Delete file
deleteFile(path: string): Promise<void>;
```

### String Operations

```typescript
// Sanitize filename
sanitizeFilename(name: string): string;

// Generate unique filename
generateUniqueFilename(name: string, path: string): Promise<string>;

// Format path
formatPath(path: string): string;

// Join paths
joinPaths(...paths: string[]): string;
```

### Date Operations

```typescript
// Parse date string
parseDate(date: string): Date;

// Format date string
formatDateString(date: Date, format: string): string;

// Get relative time string
getRelativeTimeString(date: Date): string;

// Check if date is valid
isValidDate(date: any): boolean;
```

### Validation

```typescript
// Validate template
validateTemplate(template: string): ValidationResult;

// Validate options
validateOptions(options: any): ValidationResult;

// Validate path
validatePath(path: string): ValidationResult;

// Validate token
validateToken(token: string): ValidationResult;
```

### Error Handling

```typescript
// Create error
createError(message: string, code?: string): Error;

// Handle error
handleError(error: Error): void;

// Log error
logError(error: Error): void;

// Format error
formatError(error: Error): string;
```

## Configuration

### Settings Interface

```typescript
interface PluginSettings {
    apiToken: string;
    defaultPath: string;
    filenameTemplate: string;
    showRibbonIcon: boolean;
    bannerFieldName: string;
    rateLimit: number;
    retryCount: number;
    retryDelay: number;
    debugMode: boolean;
}
```

### Settings Methods

```typescript
// Load settings
loadSettings(): Promise<PluginSettings>;

// Save settings
saveSettings(settings: PluginSettings): Promise<void>;

// Reset settings
resetSettings(): Promise<void>;

// Validate settings
validateSettings(settings: PluginSettings): ValidationResult;
```

## Constants

### API Constants

```typescript
const API_BASE_URL = 'https://api.raindrop.io/rest/v1';
const API_RATE_LIMIT = 120;
const API_RETRY_COUNT = 3;
const API_RETRY_DELAY = 1000;
```

### File Constants

```typescript
const DEFAULT_PATH = 'Raindrops';
const DEFAULT_TEMPLATE = '{{title}}';
const DEFAULT_BANNER_FIELD = 'banner';
const FILE_EXTENSION = '.md';
```

### Error Constants

```typescript
const ERROR_CODES = {
    INVALID_TOKEN: 'INVALID_TOKEN',
    RATE_LIMIT: 'RATE_LIMIT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    FILE_ERROR: 'FILE_ERROR'
};
```
