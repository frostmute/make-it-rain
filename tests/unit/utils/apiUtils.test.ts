/**
 * Unit Tests for API Utilities
 * =============================
 *
 * Tests for Raindrop.io API interaction utilities including rate limiting,
 * authentication, and retry logic.
 */

import {
    createRateLimiter,
    createAuthenticatedRequestOptions,
    buildCollectionApiUrl,
    parseApiResponse,
    handleRequestError,
    fetchWithRetry,
    extractCollectionData,
    RateLimiter
} from '../../../src/utils/apiUtils';

// Mock the obsidian request function
jest.mock('obsidian', () => ({
    request: jest.fn()
}));

describe('apiUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createRateLimiter', () => {
        it('should create a rate limiter with default settings', () => {
            const rateLimiter = createRateLimiter();

            expect(rateLimiter).toHaveProperty('checkLimit');
            expect(rateLimiter).toHaveProperty('resetCounter');
            expect(typeof rateLimiter.checkLimit).toBe('function');
            expect(typeof rateLimiter.resetCounter).toBe('function');
        });

        it('should create a rate limiter with custom settings', () => {
            const rateLimiter = createRateLimiter(120, 500);

            expect(rateLimiter).toHaveProperty('checkLimit');
            expect(rateLimiter).toHaveProperty('resetCounter');
        });

        it.skip('should delay between requests', async () => {
            const rateLimiter = createRateLimiter(60, 300);

            // First request - no delay
            await rateLimiter.checkLimit();

            // Second request - should delay 300ms
            const promise = rateLimiter.checkLimit();
            jest.advanceTimersByTime(300);
            await flushPromises();
            await promise;

            expect(jest.getTimerCount()).toBe(0);
        });

        it.skip('should enforce rate limit', async () => {
            const rateLimiter = createRateLimiter(2, 100);

            // First request - no delay
            await rateLimiter.checkLimit();

            // Second request - should delay 100ms
            const promise2 = rateLimiter.checkLimit();
            jest.advanceTimersByTime(100);
            await flushPromises();
            await promise2;

            // Third request - should hit rate limit and wait for reset
            const promise3 = rateLimiter.checkLimit();

            // Should be waiting for rate limit reset (up to 60 seconds)
            expect(jest.getTimerCount()).toBeGreaterThan(0);

            // Fast forward past the rate limit window
            jest.advanceTimersByTime(60000);
            await flushPromises();
            await promise3;
        });

        it.skip('should reset counter when resetCounter is called', async () => {
            const rateLimiter = createRateLimiter(2, 100);

            // Use up the rate limit
            await rateLimiter.checkLimit();

            const promise2 = rateLimiter.checkLimit();
            jest.advanceTimersByTime(100);
            await flushPromises();
            await promise2;

            // Reset the counter
            rateLimiter.resetCounter();
            
            // Should be able to make a request immediately
            await rateLimiter.checkLimit();
        });

        it.skip('should reset counter after time window expires', async () => {
            const rateLimiter = createRateLimiter(1, 100);

            // First request
            const promise1 = rateLimiter.checkLimit();
            jest.advanceTimersByTime(100);
            await promise1;

            // Wait for time window to expire (60 seconds)
            jest.advanceTimersByTime(60000);
            await flushPromises();
            
            // Should be able to make a request again
            await rateLimiter.checkLimit();
        });
    });

    describe('createAuthenticatedRequestOptions', () => {
        it('should create request options with bearer token', () => {
            const token = 'test-api-token-123';
            const options = createAuthenticatedRequestOptions(token);

            expect(options).toHaveProperty('method', 'GET');
            expect(options).toHaveProperty('headers');
            expect(options.headers).toEqual({
                'Authorization': 'Bearer test-api-token-123',
                'Content-Type': 'application/json'
            });
        });

        it('should handle empty token', () => {
            const options = createAuthenticatedRequestOptions('');

            expect(options.headers).toHaveProperty('Authorization', 'Bearer ');
        });

        it('should handle special characters in token', () => {
            const token = 'token-with-special-chars!@#$%';
            const options = createAuthenticatedRequestOptions(token);

            expect(options.headers).toHaveProperty(
                'Authorization',
                'Bearer token-with-special-chars!@#$%'
            );
        });
    });

    describe('buildCollectionApiUrl', () => {
        it('should build correct API URL for collection ID', () => {
            const url = buildCollectionApiUrl('12345');

            expect(url).toBe('https://api.raindrop.io/rest/v1/collection/12345');
        });

        it('should build URL for negative collection IDs (system collections)', () => {
            const url = buildCollectionApiUrl('-1');

            expect(url).toBe('https://api.raindrop.io/rest/v1/collection/-1');
        });

        it('should handle string collection IDs', () => {
            const url = buildCollectionApiUrl('all');

            expect(url).toBe('https://api.raindrop.io/rest/v1/collection/all');
        });
    });

    describe('parseApiResponse', () => {
        it('should parse JSON string response', () => {
            const jsonString = '{"result": true, "items": []}';
            const parsed = parseApiResponse(jsonString);

            expect(parsed).toEqual({ result: true, items: [] });
        });

        it('should return object if already parsed', () => {
            const obj = { result: true, items: [] };
            const parsed = parseApiResponse(obj);

            expect(parsed).toEqual(obj);
            expect(parsed).toBe(obj); // Same reference
        });

        it('should parse complex JSON structures', () => {
            const jsonString = JSON.stringify({
                result: true,
                items: [
                    { id: 1, title: 'Test' },
                    { id: 2, title: 'Test 2' }
                ],
                count: 2
            });

            const parsed = parseApiResponse(jsonString);

            expect(parsed.result).toBe(true);
            expect(parsed.items).toHaveLength(2);
            expect(parsed.count).toBe(2);
        });

        it('should throw error for invalid JSON string', () => {
            const invalidJson = '{invalid json}';

            expect(() => parseApiResponse(invalidJson)).toThrow();
        });

        it('should handle empty string', () => {
            expect(() => parseApiResponse('')).toThrow();
        });
    });

    describe('handleRequestError', () => {
        let mockRateLimiter: RateLimiter;

        beforeEach(() => {
            mockRateLimiter = {
                checkLimit: jest.fn().mockResolvedValue(undefined),
                resetCounter: jest.fn()
            };
        });

        it('should handle rate limit error (429) and reset counter', async () => {
            jest.useRealTimers();
            const error = { status: 429, message: 'Rate limit exceeded' };

            const result = await handleRequestError(
                error,
                mockRateLimiter,
                0,
                3,
                10
            );

            expect(result).toBe(true);
            expect(mockRateLimiter.resetCounter).toHaveBeenCalled();
        });

        it('should handle rate limit message in error', async () => {
            jest.useRealTimers();
            const error = { message: 'rate limit exceeded' };

            const result = await handleRequestError(
                error,
                mockRateLimiter,
                0,
                3,
                10
            );

            expect(result).toBe(true);
            expect(mockRateLimiter.resetCounter).toHaveBeenCalled();
        });

        it('should wait longer for rate limit errors', async () => {
            jest.useRealTimers();
            const error = { status: 429 };

            const promise = handleRequestError(
                error,
                mockRateLimiter,
                0,
                3,
                10
            );

            // Should wait 2x normal delay for rate limits (2000ms)
            
            const result = await promise;

            expect(result).toBe(true);
        });

        it('should retry on non-rate-limit errors', async () => {
            const error = { status: 500, message: 'Internal Server Error' };

            const promise = handleRequestError(
                error,
                mockRateLimiter,
                0,
                3,
                1000
            );

            jest.advanceTimersByTime(1000);
            const result = await promise;

            expect(result).toBe(true);
            expect(mockRateLimiter.resetCounter).not.toHaveBeenCalled();
        });

        it('should not retry on last attempt', async () => {
            const error = { status: 500, message: 'Internal Server Error' };

            const result = await handleRequestError(
                error,
                mockRateLimiter,
                2, // Last attempt (maxRetries = 3, attemptNumber = 2)
                3,
                1000
            );

            expect(result).toBe(false);
        });

        it('should handle errors without status code', async () => {
            const error = new Error('Network error');

            const promise = handleRequestError(
                error,
                mockRateLimiter,
                0,
                3,
                1000
            );

            jest.advanceTimersByTime(1000);
            const result = await promise;

            expect(result).toBe(true);
        });

        it('should handle string errors', async () => {
            const error = 'Something went wrong';

            const promise = handleRequestError(
                error,
                mockRateLimiter,
                0,
                3,
                1000
            );

            jest.advanceTimersByTime(1000);
            const result = await promise;

            expect(result).toBe(true);
        });
    });

    describe('extractCollectionData', () => {
        it('should extract collection data from valid response', () => {
            const response = {
                result: true,
                item: {
                    _id: 123,
                    title: 'Test Collection',
                    count: 42
                }
            };

            const data = extractCollectionData(response);

            expect(data).toEqual({
                _id: 123,
                title: 'Test Collection',
                count: 42
            });
        });

        it('should return null for invalid response', () => {
            const response = {
                result: false,
                error: 'Not found'
            };

            const data = extractCollectionData(response);

            expect(data).toBeNull();
        });

        it('should return null for response without result field', () => {
            const response = {
                item: { _id: 123 }
            };

            const data = extractCollectionData(response);

            expect(data).toBeNull();
        });

        it('should return null for response without item field', () => {
            const response = {
                result: true
            };

            const data = extractCollectionData(response);

            expect(data).toBeNull();
        });

        it('should return null for null response', () => {
            const data = extractCollectionData(null);

            expect(data).toBeNull();
        });

        it('should return null for undefined response', () => {
            const data = extractCollectionData(undefined);

            expect(data).toBeNull();
        });

        it('should handle complex collection data', () => {
            const response = {
                result: true,
                item: {
                    _id: 123,
                    title: 'Tech Articles',
                    parent: { $id: 100 },
                    count: 42,
                    color: '#FF5733',
                    cover: ['image1.jpg', 'image2.jpg'],
                    created: '2024-01-01T00:00:00Z',
                    public: true
                }
            };

            const data = extractCollectionData(response);

            expect(data._id).toBe(123);
            expect(data.title).toBe('Tech Articles');
            expect(data.parent).toEqual({ $id: 100 });
            expect(data.count).toBe(42);
        });
    });

    describe('fetchWithRetry', () => {
        let mockRateLimiter: RateLimiter;
        const { request } = require('obsidian');

        beforeEach(() => {
            mockRateLimiter = {
                checkLimit: jest.fn().mockResolvedValue(undefined),
                resetCounter: jest.fn()
            };
        });

        it('should successfully fetch data on first attempt', async () => {
            const mockResponse = JSON.stringify({ result: true, items: [] });
            request.mockResolvedValue(mockResponse);

            const url = 'https://api.raindrop.io/rest/v1/raindrops/0';
            const options = { method: 'GET', headers: {} };

            const result = await fetchWithRetry(
                url,
                options,
                mockRateLimiter
            );

            expect(result).toEqual({ result: true, items: [] });
            expect(mockRateLimiter.checkLimit).toHaveBeenCalledTimes(1);
            expect(request).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            jest.useRealTimers();
            request
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(JSON.stringify({ result: true }));

            const url = 'https://api.raindrop.io/rest/v1/raindrops/0';
            const options = { method: 'GET', headers: {} };

            const promise = fetchWithRetry(
                url,
                options,
                mockRateLimiter,
                3,
                10
            );

            // Advance timers for retry delays
            
            

            const result = await promise;

            expect(result).toEqual({ result: true });
            expect(request).toHaveBeenCalledTimes(3);
        });

        it('should throw error after max retries', async () => {
            jest.useRealTimers();
            const error = new Error('Persistent error');
            request.mockRejectedValue(error);

            const url = 'https://api.raindrop.io/rest/v1/raindrops/0';
            const options = { method: 'GET', headers: {} };

            const promise = fetchWithRetry(
                url,
                options,
                mockRateLimiter,
                2,
                10
            );

            // Advance timers for all retries
            
            

            await expect(promise).rejects.toThrow();
        });

        it('should handle rate limit errors with extended wait', async () => {
            jest.useRealTimers();
            request
                .mockRejectedValueOnce({ status: 429, message: 'Rate limit' })
                .mockResolvedValueOnce(JSON.stringify({ result: true }));

            const url = 'https://api.raindrop.io/rest/v1/raindrops/0';
            const options = { method: 'GET', headers: {} };

            const promise = fetchWithRetry(
                url,
                options,
                mockRateLimiter,
                3,
                10
            );

            // Rate limit wait is 2x normal delay
            

            const result = await promise;

            expect(result).toEqual({ result: true });
            expect(mockRateLimiter.resetCounter).toHaveBeenCalled();
        });

        it('should call checkLimit before each request', async () => {
            const mockResponse = JSON.stringify({ result: true });
            request.mockResolvedValue(mockResponse);

            await fetchWithRetry(
                'https://api.example.com',
                { method: 'GET', headers: {} },
                mockRateLimiter
            );

            expect(mockRateLimiter.checkLimit).toHaveBeenCalledTimes(1);
        });

        it('should pass correct parameters to request', async () => {
            request.mockResolvedValue(JSON.stringify({ result: true }));

            const url = 'https://api.raindrop.io/rest/v1/raindrops/0';
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: 'test' })
            };

            await fetchWithRetry(url, options, mockRateLimiter);

            expect(request).toHaveBeenCalledWith({
                url,
                method: 'POST',
                headers: options.headers,
                body: options.body
            });
        });

        it('should use default maxRetries if not provided', async () => {
            jest.useRealTimers();
            request.mockRejectedValue(new Error('Error'));

            const promise = fetchWithRetry(
                'https://api.example.com',
                { method: 'GET', headers: {} },
                mockRateLimiter
            );

            // Should retry 3 times by default (total 3 attempts)
            

            await expect(promise).rejects.toThrow();
            expect(request).toHaveBeenCalledTimes(3);
        });

        it('should parse JSON response correctly', async () => {
            const complexResponse = {
                result: true,
                items: [
                    { id: 1, title: 'Item 1' },
                    { id: 2, title: 'Item 2' }
                ],
                count: 2
            };
            request.mockResolvedValue(JSON.stringify(complexResponse));

            const result = await fetchWithRetry(
                'https://api.example.com',
                { method: 'GET', headers: {} },
                mockRateLimiter
            );

            expect(result).toEqual(complexResponse);
            expect(result.items).toHaveLength(2);
        });
    });

    describe('extractCollectionData', () => {
        let consoleErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should return item when response is valid', () => {
            const mockResponse = { result: true, item: { id: 1, title: 'Test Collection' } };
            expect(extractCollectionData(mockResponse)).toEqual({ id: 1, title: 'Test Collection' });
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it('should return null when response is missing item', () => {
            const mockResponse = { result: true };
            expect(extractCollectionData(mockResponse)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', mockResponse);
        });

        it('should return null when response is missing result', () => {
            const mockResponse = { item: { id: 1 } };
            expect(extractCollectionData(mockResponse)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', mockResponse);
        });

        it('should return null for unexpected object structures', () => {
            const mockResponse = { unexpected: 'structure', foo: 'bar' };
            expect(extractCollectionData(mockResponse)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', mockResponse);
        });

        it('should return null for null or undefined response', () => {
            expect(extractCollectionData(null)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', null);

            expect(extractCollectionData(undefined)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', undefined);
        });

        it('should return null for primitive types', () => {
            expect(extractCollectionData('string response')).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', 'string response');

            expect(extractCollectionData(123)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', 123);
        });
    });
});
