import { fetchData } from './apiUtils';
import { extractCollectionData } from '../../../src/utils/apiUtils';

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
