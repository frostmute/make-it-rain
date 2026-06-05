import { 
    isHtmlOrText, 
    getExtensionFromMagicBytes, 
    validateBinaryMagicBytes, 
    downloadBinaryFile 
} from '../../../src/utils/downloadUtils';
import { requestUrl } from 'obsidian';

jest.mock('obsidian', () => ({
    requestUrl: jest.fn()
}), { virtual: true });

describe('downloadUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isHtmlOrText', () => {
        it('identifies HTML content correctly', () => {
            const html = '<!DOCTYPE html><html><body>Error</body></html>';
            const buffer = new Uint8Array(Array.from(html).map(c => c.charCodeAt(0))).buffer;
            expect(isHtmlOrText(buffer)).toBe(true);
        });

        it('identifies JSON content correctly', () => {
            const json = '{"error": "Unauthorized"}';
            const buffer = new Uint8Array(Array.from(json).map(c => c.charCodeAt(0))).buffer;
            expect(isHtmlOrText(buffer)).toBe(true);
        });

        it('identifies non-HTML binary data as false', () => {
            const binary = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            expect(isHtmlOrText(binary.buffer)).toBe(false);
        });
    });

    describe('getExtensionFromMagicBytes', () => {
        it('detects PNG magic bytes', () => {
            const binary = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('png');
        });

        it('detects PDF magic bytes', () => {
            const binary = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('pdf');
        });

        it('detects JPEG magic bytes (3 bytes)', () => {
            const binary = new Uint8Array([0xFF, 0xD8, 0xFF]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('jpg');
        });

        it('detects JPEG magic bytes (4+ bytes)', () => {
            const binary = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('jpg');
        });

        it('returns null for buffers shorter than 3 bytes', () => {
            const binary = new Uint8Array([0xFF, 0xD8]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBeNull();
        });

        it('detects GIF magic bytes', () => {
            const binary = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('gif');
        });

        it('detects ZIP magic bytes', () => {
            const binary = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('zip');
        });

        it('detects EPUB magic bytes', () => {
            const binary = new Uint8Array(60);
            binary[0] = 0x50;
            binary[1] = 0x4B;
            binary[2] = 0x03;
            binary[3] = 0x04;
            // mimtypeapplication/epub+zip starting at 30
            const mime = 'mimetypeapplication/epub+zip';
            for (let i = 0; i < mime.length; i++) {
                binary[30 + i] = mime.charCodeAt(i);
            }
            expect(getExtensionFromMagicBytes(binary.buffer)).toBe('epub');
        });
    });

    describe('validateBinaryMagicBytes', () => {
        it('validates matching extensions', () => {
            const binary = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
            const res = validateBinaryMagicBytes(binary.buffer, 'png');
            expect(res.isValid).toBe(true);
        });

        it('rejects mismatching extensions', () => {
            const binary = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
            const res = validateBinaryMagicBytes(binary.buffer, 'pdf');
            expect(res.isValid).toBe(false);
            expect(res.error).toContain('Magic bytes mismatch');
        });

        it('rejects HTML content disguised as binary', () => {
            const html = '<!DOCTYPE html><html><body>Error</body></html>';
            const buffer = new Uint8Array(Array.from(html).map(c => c.charCodeAt(0))).buffer;
            const res = validateBinaryMagicBytes(buffer, 'pdf');
            expect(res.isValid).toBe(false);
            expect(res.error).toContain('contains HTML/text/JSON');
        });
    });

    describe('downloadBinaryFile', () => {
        it('returns buffer on status 200', async () => {
            (requestUrl as jest.Mock).mockResolvedValue({
                status: 200,
                arrayBuffer: new ArrayBuffer(10),
                headers: {}
            });

            const res = await downloadBinaryFile('https://example.com/file.png', 'token');
            expect(res.status).toBe(200);
            expect(res.arrayBuffer).toBeDefined();
            expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
                url: 'https://example.com/file.png',
                headers: { 'Authorization': 'Bearer token' }
            }));
        });

        it('follows 303 redirect and strips authorization', async () => {
            (requestUrl as jest.Mock)
                .mockResolvedValueOnce({
                    status: 303,
                    headers: { location: 'https://s3.amazonaws.com/bucket/file.png' }
                })
                .mockResolvedValueOnce({
                    status: 200,
                    arrayBuffer: new ArrayBuffer(20),
                    headers: {}
                });

            const res = await downloadBinaryFile('https://example.com/redirect', 'token');
            expect(res.status).toBe(200);
            expect(res.arrayBuffer).toBeDefined();
            expect(res.redirectUrl).toBe('https://s3.amazonaws.com/bucket/file.png');
            expect(requestUrl).toHaveBeenCalledTimes(2);
            
            // Verify second call does NOT contain Authorization
            const secondCallArgs = (requestUrl as jest.Mock).mock.calls[1][0];
            expect(secondCallArgs.url).toBe('https://s3.amazonaws.com/bucket/file.png');
            expect(secondCallArgs.headers).toBeUndefined();
        });
    });
});
