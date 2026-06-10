import { requestUrl } from 'obsidian';

/**
 * Checks if the buffer starts with HTML/XML tags or JSON, which usually indicates
 * that an error page or error JSON was returned instead of the binary file.
 */
export function isHtmlOrText(buffer: ArrayBuffer): boolean {
    if (!buffer || buffer.byteLength === 0) return false;
    const bytes = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 200)));
    let text = '';
    for (let i = 0; i < bytes.length; i++) {
        text += String.fromCharCode(bytes[i]);
    }
    const cleanText = text.trim().toLowerCase();
    return (
        cleanText.startsWith('<!doctype') ||
        cleanText.startsWith('<html') ||
        cleanText.startsWith('<?xml') ||
        cleanText.startsWith('<xml') ||
        cleanText.startsWith('{"')
    );
}

/**
 * Detects the file extension from the magic bytes of a binary buffer.
 * Returns the detected extension, or null if no match found.
 */
export function getExtensionFromMagicBytes(buffer: ArrayBuffer): string | null {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 3) return null;

    // JPEG: FF D8 FF (only needs 3 bytes)
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'jpg';
    }

    // All remaining checks need at least 4 bytes
    if (bytes.length < 4) return null;

    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'png';
    }

    // PDF: %PDF (25 50 44 46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return 'pdf';
    }

    // GIF: GIF87a or GIF89a (47 49 46 38)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return 'gif';
    }

    // ZIP / EPUB: PK.. (50 4B 03 04)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
        if (bytes.length >= 58) {
            let signature = '';
            for (let i = 30; i < 58; i++) {
                signature += String.fromCharCode(bytes[i]);
            }
            if (signature === 'mimetypeapplication/epub+zip') {
                return 'epub';
            }
        }
        return 'zip';
    }

    // WebP: RIFF at 0 (52 49 46 46) and WEBP at 8 (57 45 42 50)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        if (bytes.length >= 12) {
            let signature = '';
            for (let i = 8; i < 12; i++) {
                signature += String.fromCharCode(bytes[i]);
            }
            if (signature === 'WEBP') {
                return 'webp';
            }
        }
    }

    // MP3: ID3 (49 44 33) or raw frame sync (FF FB / FF F3 / FF F2)
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        return 'mp3';
    }
    if (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2)) {
        return 'mp3';
    }

    // MP4: ftyp (66 74 79 70) at index 4
    if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        return 'mp4';
    }

    return null;
}

/**
 * Validates the file buffer against expected extension.
 */
export function validateBinaryMagicBytes(
    buffer: ArrayBuffer,
    expectedExtension: string
): { isValid: boolean; error?: string; detectedExtension?: string } {
    if (!buffer || buffer.byteLength === 0) {
        return { isValid: false, error: 'Empty buffer' };
    }

    if (isHtmlOrText(buffer)) {
        return { isValid: false, error: 'Response contains HTML/text/JSON instead of binary data (likely an error page or API error response)' };
    }

    const detected = getExtensionFromMagicBytes(buffer);
    if (!detected) {
        return { isValid: true, detectedExtension: expectedExtension };
    }

    const normExpected = expectedExtension.toLowerCase().replace('jpeg', 'jpg');
    const normDetected = detected.toLowerCase().replace('jpeg', 'jpg');

    if (normExpected === 'file' || normExpected === 'bin') {
        return { isValid: true, detectedExtension: detected };
    }

    if (normExpected !== normDetected) {
        if ((normExpected === 'zip' && normDetected === 'epub') || (normExpected === 'epub' && normDetected === 'zip')) {
            return { isValid: true, detectedExtension: detected };
        }
        return { 
            isValid: false, 
            error: `Magic bytes mismatch. Expected: ${expectedExtension}, Detected: ${detected}`,
            detectedExtension: detected 
        };
    }

    return { isValid: true, detectedExtension: detected };
}

/**
 * Downloads a binary file, manually following redirects and stripping Authorization headers
 * for external redirects (like AWS S3).
 */
export async function downloadBinaryFile(
    url: string,
    apiToken: string
): Promise<{ status: number; arrayBuffer?: ArrayBuffer; error?: string; redirectUrl?: string }> {
    try {
        const response = await requestUrl({
            url: url,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            },
            throw: false
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers?.['location'] || response.headers?.['Location'];
            if (!location) {
                return { status: response.status, error: 'Redirect received but no Location header found' };
            }
            
            const headers: Record<string, string> = {};
            // DO NOT send Raindrop auth headers to S3 pre-signed URLs or they will fail signature validation
            if (!location.includes('amazonaws.com') && !location.includes('X-Amz-Signature=')) {
                headers['Authorization'] = `Bearer ${apiToken}`;
            }

            const redirectResponse = await requestUrl({
                url: location,
                method: 'GET',
                headers,
                throw: false
            });

            if (redirectResponse.status === 200) {
                return { status: redirectResponse.status, arrayBuffer: redirectResponse.arrayBuffer, redirectUrl: location };
            }
            return { status: redirectResponse.status, error: `Redirect target returned status ${redirectResponse.status}`, redirectUrl: location };
        }

        if (response.status === 200) {
            return { status: response.status, arrayBuffer: response.arrayBuffer };
        }

        return { status: response.status, error: `Server returned status ${response.status}` };
    } catch (e) {
        return { status: 0, error: e instanceof Error ? e.message : String(e) };
    }
}
