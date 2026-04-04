import { fetchData } from './apiUtils';

describe('API Utils', () => {
    // ... other tests 

    it('should handle rate limit error (429) and reset counter', async () => {
        // test implementation
    }, 10000);

    it('should handle rate limit message in error', async () => {
        // test implementation
    }, 10000);

    // ... more tests

    it('should retry on failure and eventually succeed', async () => {
        // test implementation
    }, 10000);

    it('should throw error after max retries', async () => {
        // test implementation
    }, 10000);

    it('should handle rate limit errors with extended wait', async () => {
        // test implementation
    }, 10000);

    it('should use default maxRetries if not provided', async () => {
        // test implementation
    }, 10000);
});