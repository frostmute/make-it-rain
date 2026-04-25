import { App } from 'obsidian';
import { sanitizeFileName } from './fileUtils';
import { RaindropCollection } from '../types';


/**
 * API Utilities for Make It Rain
 * ==============================
 * 
 * This module provides utilities for interacting with the Raindrop.io API, focusing on:
 * - Rate limiting to respect API usage constraints
 * - Authentication and request handling
 * - Error handling and retry logic
 * - Response parsing and data extraction
 * 
 * These utilities follow functional programming principles, using closures for state management
 * and pure functions for data transformation. Each function is designed to handle a specific
 * concern, promoting separation of responsibilities and code reusability.
 * 
 * The API utilities are particularly important for ensuring reliable communication with
 * Raindrop.io's servers, even in cases of temporary network issues or rate limiting.
 */

/**
 * Interface for rate limiter functionality
 * 
 * Provides methods to manage API request pacing to avoid hitting rate limits.
 * Implemented using a functional closure pattern to maintain internal state.
 */
export interface RateLimiter {
    checkLimit: () => Promise<void>;
    resetCounter: () => void;
}

/**
 * Creates a rate limiter that manages API request pacing
 * Uses a functional closure approach to maintain state
 * 
 * @param maxRequestsPerMinute - Maximum number of requests allowed per minute
 * @param delayBetweenRequests - Milliseconds to wait between requests
 * @returns A rate limiter object with methods to check limits and reset counters
 */
export function createRateLimiter(maxRequestsPerMinute = 60, delayBetweenRequests = 300): RateLimiter {
    let requestCount = 0;
    let resetTime = Date.now() + 60000; // 1 minute window
    
    /**
     * Checks if we're within rate limits and handles delays if needed
     */

    let queuePromise: Promise<void> = Promise.resolve();

    /**
     * Checks if we're within rate limits and handles delays if needed
     */
    const checkLimit = (): Promise<void> => {
        // Chain promises to ensure sequential execution of the rate limit check
        // even when called concurrently
        const nextPromise = queuePromise.then(async () => {
            const now = Date.now();

            // Reset counter if we're in a new time window
            if (now > resetTime) {
                resetTime = now + 60000;
                requestCount = 0;
            }

            // If we've hit the rate limit, wait for the reset
            if (requestCount >= maxRequestsPerMinute) {
                const waitTime = resetTime - now;
                console.debug(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                // Reset after waiting
                resetTime = Date.now() + 60000;
                requestCount = 0;
            } else if (requestCount > 0) {
                // Standard delay between requests to be polite to the API
                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
            }

            // Increment counter after making a request
            requestCount++;
        });

        // Update the tail of the queue
        queuePromise = nextPromise.catch(() => {});

        return nextPromise;
    };

    /**
     * Resets the counter when hitting a rate limit
     */
    const resetCounter = (): void => {
        resetTime = Date.now() + 60000;
        requestCount = 0;
        console.debug('Rate limiter counter reset.');
    };
    
    return { checkLimit, resetCounter };
}

/**
 * Creates authenticated request options for Raindrop.io API
 * 
 * @param apiToken - The Raindrop.io API token
 * @returns Request options with proper headers
 */
export function createAuthenticatedRequestOptions(apiToken: string): RequestInit {
    return {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
    };
}

/**
 * Builds a URL for the Raindrop.io collection API
 * 
 * @param collectionId - The ID of the collection to fetch
 * @returns The full API URL for the collection
 */
export function buildCollectionApiUrl(collectionId: string): string {
    return `https://api.raindrop.io/rest/v1/collection/${collectionId}`;
}

/**
 * Parses the API response based on its type
 * 
 * @param response - The response from the API
 * @returns Parsed JSON data
 */
export function parseApiResponse(response: string | object): any {
    if (typeof response === 'string') {
        return JSON.parse(response);
    }
    return response;
}

/**
 * Handles request errors, especially for rate limiting
 * 
 * @param error - The error that occurred
 * @param rateLimiter - The rate limiter instance
 * @param attemptNumber - Current attempt number
 * @param maxRetries - Maximum number of retries
 * @param delayBetweenRetries - Delay between retry attempts
 * @returns True if error was handled and retry should happen, false otherwise
 */
export async function handleRequestError(
    error: any, 
    rateLimiter: RateLimiter, 
    attemptNumber: number, 
    maxRetries: number,
    delayBetweenRetries: number
): Promise<boolean> {
    const isLastAttempt = attemptNumber >= maxRetries - 1;
    
    // Handle rate limiting (HTTP 429)
    if (error.status === 429 || (error.message && error.message.includes('rate limit'))) {
        console.debug('Rate limit hit, resetting counter and waiting...');
        rateLimiter.resetCounter();
        await new Promise(resolve => setTimeout(resolve, delayBetweenRetries * 2)); // Longer wait for rate limits
        return true; // We handled the error, continue with retry
    }
    
    // For other errors, log and possibly retry
    console.error(`Error in API request (attempt ${attemptNumber + 1}/${maxRetries}):`, error);
    
    if (!isLastAttempt) {
        // Wait and retry for non-rate limit errors
        await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
        return true; // Continue with retry
    }
    
    return false; // Don't retry if it's the last attempt
}

/**
 * Fetches data from an API with retry logic and rate limiting
 * Supports two call patterns for backward compatibility:
 * 1. (app, url, requestOptions, rateLimiter, maxRetries?, delayBetweenRetries?)
 * 2. (url, requestOptions, rateLimiter, maxRetries?)
 * 
 * @param appOrUrl - Either an App instance or the URL string
 * @param urlOrOptions - Either the URL string or request options
 * @param optionsOrRateLimiter - Either request options or rate limiter
 * @param rateLimiterOrMaxRetries - Either rate limiter or max retries
 * @param maxRetries - Maximum number of retry attempts
 * @param delayBetweenRetries - Delay between retry attempts in milliseconds
 * @returns The parsed API response
 */
export async function fetchWithRetry(
    appOrUrl: App | string, 
    urlOrOptions: string | RequestInit, 
    optionsOrRateLimiter?: RequestInit | RateLimiter,
    rateLimiterOrMaxRetries?: RateLimiter | number,
    maxRetries: number = 3,
    delayBetweenRetries: number = 1000
): Promise<any> {
    // Normalize parameters to handle both calling patterns
    let url: string;
    let requestOptions: RequestInit;
    let rateLimiter: RateLimiter;
    
    if (typeof appOrUrl === 'string') {
        // Old pattern: (url, options, rateLimiter, maxRetries?)
        url = appOrUrl;
        requestOptions = urlOrOptions as RequestInit;
        rateLimiter = optionsOrRateLimiter as RateLimiter;
        
        // Check if maxRetries was provided
        if (typeof rateLimiterOrMaxRetries === 'number') {
            maxRetries = rateLimiterOrMaxRetries;
        }
    } else {
        // New pattern: (app, url, options, rateLimiter, maxRetries?, delay?)
        url = urlOrOptions as string;
        requestOptions = optionsOrRateLimiter as RequestInit;
        rateLimiter = rateLimiterOrMaxRetries as RateLimiter;
    }
    
    // Try up to maxRetries times
    let attemptNumber = 0;
    while (true) {
        const isLastAttempt = attemptNumber >= maxRetries - 1;
        
        try {
            // Check rate limit before making request
            await rateLimiter.checkLimit();
            
            // Use Obsidian's request API for consistent behavior across platforms
            const response = await request({
                url: url,
                method: requestOptions.method || 'GET',
                headers: requestOptions.headers as Record<string, string>,
                body: requestOptions.body as string | ArrayBuffer | undefined
            });
            
            // Parse and return the response
            return parseApiResponse(response);
            
        } catch (error) {
            // Handle rate limiting and retry logic
            const shouldRetry = await handleRequestError(error, rateLimiter, attemptNumber, maxRetries, delayBetweenRetries);
            if (!shouldRetry || isLastAttempt) {
                // If it's the last attempt or error handling didn't resolve it, rethrow
                throw error;
            }
            attemptNumber++;
        }
    }
}

/**
 * Extracts collection data from API response
 * @param response - The raw API response
 * @returns The collection data or null if invalid response
 */
export function extractCollectionData(response: unknown): RaindropCollection | null {
    if (response && typeof response === 'object' && 'result' in response && response.result === true && 'item' in response) {
        return (response as any).item as RaindropCollection;
    }
    
    console.error('Failed to fetch collection info:', response);
    return null;
}

/**
 * Helper function to get the full path segments from the root collection down to the given ID
 * 
 * @param collectionId - The ID of the collection to get path for
 * @param hierarchy - Map of collection IDs to their parent info
 * @param idToNameMap - Map of collection IDs to their titles
 * @returns Array of sanitized path segments from root to collection
 */
export function getFullPathSegments(
    collectionId: number,
    hierarchy: Map<number, { title: string, parentId?: number }>,
    idToNameMap: Map<number, string>
): string[] {
    const segments: string[] = [];
    let currentId: number | undefined = collectionId;

    // Traversal upward to root (excluding system collections -1, -99 and root 0)
    while (currentId !== undefined && currentId !== 0 && currentId !== -1 && currentId !== -99) {
        const collection = hierarchy.get(currentId);
        if (!collection) break;

        const name = idToNameMap.get(currentId);
        if (name) {
            segments.unshift(sanitizeFileName(name));
        }

        currentId = collection.parentId;
    }

    return segments;
}

