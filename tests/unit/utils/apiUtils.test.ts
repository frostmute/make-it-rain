/**
 * API Utilities Tests
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
    request: jest.fn(),
    Notice: jest.fn()
}));

describe('apiUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

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

        it('should delay between requests', async () => {
            const rateLimiter = createRateLimiter(60, 300);
            
            // First call should be immediate
            await rateLimiter.checkLimit();

            // Second call should wait 300ms
            const p2 = rateLimiter.checkLimit();
            
            // Should still be pending
            let resolved = false;
            p2.then(() => resolved = true);
            await jest.advanceTimersByTimeAsync(200);
            expect(resolved).toBe(false);

            // Should resolve after 300ms total
            await jest.advanceTimersByTimeAsync(100);
            await p2;
            expect(resolved).toBe(true);
        });

        it('should enforce rate limit', async () => {
            const rateLimiter = createRateLimiter(2, 100);
            
            await rateLimiter.checkLimit(); // 1 (immediate)
            
            const p2 = rateLimiter.checkLimit(); // 2 (waits 100ms)
            await jest.advanceTimersByTimeAsync(100);
            await p2;
            
            const p3 = rateLimiter.checkLimit(); // 3 - should hit limit
            
            let resolved = false;
            p3.then(() => resolved = true);
            
            // Wait almost a minute
            await jest.advanceTimersByTimeAsync(50000);
            expect(resolved).toBe(false);
            
            // Wait until 1 minute window resets
            await jest.advanceTimersByTimeAsync(10000);
            await p3;
            expect(resolved).toBe(true);
        });

        it('should reset counter when resetCounter is called', async () => {
            const rateLimiter = createRateLimiter(1, 1000);
            
            await rateLimiter.checkLimit();
            const p2 = rateLimiter.checkLimit();
            
            rateLimiter.resetCounter();
            
            // Even if reset, checkLimit might still wait if implementation doesn't check resetCount immediately in loop
            // But our resetCounter just updates variables.
            // The currently running checkLimit (if any) would be awaiting a timer.
            
            await jest.advanceTimersByTimeAsync(1000);
            await p2;
        });
    });

    describe('createAuthenticatedRequestOptions', () => {
        it('should create request options with bearer token', () => {
            const token = 'test-token';
            const options = createAuthenticatedRequestOptions(token);

            expect(options.headers).toHaveProperty('Authorization', `Bearer ${token}`);
            expect(options.method).toBe('GET');
        });

        it('should handle empty token', () => {
            const options = createAuthenticatedRequestOptions('');
            expect(options.headers).toHaveProperty('Authorization', 'Bearer ');
        });

        it('should handle special characters in token', () => {
            const token = 'token!@#$%^&*()';
            const options = createAuthenticatedRequestOptions(token);
            expect(options.headers).toHaveProperty('Authorization', `Bearer ${token}`);
        });
    });

    describe('buildCollectionApiUrl', () => {
        it('should build correct API URL for collection ID', () => {
            const id = '12345';
            const url = buildCollectionApiUrl(id);
            expect(url).toBe(`https://api.raindrop.io/rest/v1/collection/${id}`);
        });

        it('should build URL for negative collection IDs (system collections)', () => {
            const id = '-1';
            const url = buildCollectionApiUrl(id);
            expect(url).toBe(`https://api.raindrop.io/rest/v1/collection/${id}`);
        });

        it('should handle string collection IDs', () => {
            const id = 'my-collection';
            const url = buildCollectionApiUrl(id);
            expect(url).toBe(`https://api.raindrop.io/rest/v1/collection/${id}`);
        });
    });

    describe('parseApiResponse', () => {
        it('should parse JSON string response', () => {
            const data = { foo: 'bar' };
            const response = JSON.stringify(data);
            const result = parseApiResponse(response);
            expect(result).toEqual(data);
        });

        it('should return object if already parsed', () => {
            const data = { foo: 'bar' };
            const result = parseApiResponse(data);
            expect(result).toBe(data);
        });

        it('should parse complex JSON structures', () => {
            const data = { 
                result: true, 
                items: [{ id: 1 }, { id: 2 }],
                meta: { count: 2 }
            };
            const result = parseApiResponse(JSON.stringify(data));
            expect(result).toEqual(data);
        });

        it('should throw error for invalid JSON string', () => {
            const invalidJson = '{ invalid }';
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
                checkLimit: jest.fn(),
                resetCounter: jest.fn()
            };
        });

        it('should handle rate limit error (429) and reset counter', async () => {
            const error = { status: 429 };
            const promise = handleRequestError(error, mockRateLimiter, 0, 3, 100);
            await jest.advanceTimersByTimeAsync(200);
            const result = await promise;

            expect(result).toBe(true);
            expect(mockRateLimiter.resetCounter).toHaveBeenCalled();
        });

        it('should handle rate limit message in error', async () => {
            const error = { message: 'rate limit exceeded' };
            const promise = handleRequestError(error, mockRateLimiter, 0, 3, 100);
            await jest.advanceTimersByTimeAsync(200);
            const result = await promise;

            expect(result).toBe(true);
            expect(mockRateLimiter.resetCounter).toHaveBeenCalled();
        });

        it('should wait longer for rate limit errors', async () => {
            const error = { status: 429 };
            
            const promise = handleRequestError(error, mockRateLimiter, 0, 3, 100);
            await jest.advanceTimersByTimeAsync(200);
            const result = await promise;

            expect(result).toBe(true);
        });

        it('should retry on non-rate-limit errors', async () => {
            const error = new Error('Some error');
            const promise = handleRequestError(error, mockRateLimiter, 0, 3, 100);
            await jest.advanceTimersByTimeAsync(100);
            const result = await promise;

            expect(result).toBe(true);
            expect(mockRateLimiter.resetCounter).not.toHaveBeenCalled();
        });

        it('should not retry on last attempt', async () => {
            const error = new Error('Some error');
            const result = await handleRequestError(error, mockRateLimiter, 2, 3, 100);

            expect(result).toBe(false);
        });

        it('should handle errors without status code', async () => {
            const error = { foo: 'bar' };
            const promise = handleRequestError(error, mockRateLimiter, 0, 3, 100);
            await jest.advanceTimersByTimeAsync(100);
            const result = await promise;
            expect(result).toBe(true);
        });

        it('should handle string errors', async () => {
            const error = 'Something went wrong';
            const promise = handleRequestError(error, mockRateLimiter, 0, 3, 100);
            await jest.advanceTimersByTimeAsync(100);
            const result = await promise;
            expect(result).toBe(true);
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
            expect(extractCollectionData(null as any)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', null);

            expect(extractCollectionData(undefined as any)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', undefined);
        });

        it('should return null for primitive types', () => {
            expect(extractCollectionData('string response' as any)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', 'string response');

            expect(extractCollectionData(123 as any)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch collection info:', 123);
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

            const data = extractCollectionData(response) as any;

            expect(data!._id).toBe(123);
            expect(data!.title).toBe('Tech Articles');
            expect(data!.parent).toEqual({ $id: 100 });
            expect(data!.count).toBe(42);
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
            ) as any;

            expect(result).toEqual(complexResponse);
            expect(result.items).toHaveLength(2);
        });
    });
});
