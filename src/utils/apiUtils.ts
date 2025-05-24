import { App, request } from 'obsidian';

/**
 * Interface for rate limiter functionality
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
    const checkLimit = async (): Promise<void> => {
        const now = Date.now();
        
        // Reset counter if we're in a new time window
        if (now > resetTime) {
            resetTime = now + 60000;
            requestCount = 0;
        }
        
        // If we've hit the rate limit, wait for the reset
        if (requestCount >= maxRequestsPerMinute) {
            const waitTime = resetTime - now;
            console.log(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Reset after waiting
            resetTime = Date.now() + 60000;
            requestCount = 0;
        } else {
            // Standard delay between requests to be polite to the API
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }
        
        // Increment counter after making a request
        requestCount++;
    };
    
    /**
     * Resets the counter when hitting a rate limit
     */
    const resetCounter = (): void => {
        resetTime = Date.now() + 60000;
        requestCount = 0;
        console.log('Rate limiter counter reset.');
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
        console.log('Rate limit hit, resetting counter and waiting...');
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
    let app: App | undefined;
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
        app = appOrUrl;
        url = urlOrOptions as string;
        requestOptions = optionsOrRateLimiter as RequestInit;
        rateLimiter = rateLimiterOrMaxRetries as RateLimiter;
    }
    
    // Try up to maxRetries times
    for (let attemptNumber = 0; attemptNumber < maxRetries; attemptNumber++) {
        const isLastAttempt = attemptNumber === maxRetries - 1;
        
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
            if (!await handleRequestError(error, rateLimiter, attemptNumber, maxRetries, delayBetweenRetries) && isLastAttempt) {
                // If it's the last attempt and error handling didn't resolve it, rethrow
                throw error;
            }
        }
    }
    
    // This should never be reached because the last iteration will either
    // return a successful response or throw an error
    throw new Error('Request failed after maximum retry attempts');
}

/**
 * Extracts collection data from API response
 * @param response - The raw API response
 * @returns The collection data or null if invalid response
 */
export function extractCollectionData(response: any): any {
    const isValidResponse = response && response.result && response.item;
    
    if (isValidResponse) {
        return response.item;
    }
    
    console.error('Failed to fetch collection info:', response);
    return null;
}
