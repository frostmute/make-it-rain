/**
 * Unit Tests for File Utilities
 * ==============================
 *
 * Tests for file system operations and path manipulation utilities.
 */

import {
  doesPathExist,
  isPathAFolder,
  createFolder,
  sanitizeFileName,
  createFolderStructure,
} from "../../../src/utils/fileUtils";

// Mock App type
interface MockApp {
  vault: {
    adapter: {
      exists: jest.Mock;
      stat: jest.Mock;
      mkdir?: jest.Mock;
    };
    createFolder: jest.Mock;
  };
}

describe("fileUtils", () => {
  let mockApp: MockApp;

  beforeEach(() => {
    // Reset mocks before each test
    mockApp = {
      vault: {
        adapter: {
          exists: jest.fn(),
          stat: jest.fn(),
          mkdir: jest.fn(),
        },
        createFolder: jest.fn(),
      },
    };
  });

  describe("doesPathExist", () => {
    it("should return true if path exists", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(true);

      const result = await doesPathExist(mockApp as any, "some/path");

      expect(result).toBe(true);
      expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith("some/path");
    });

    it("should return false if path does not exist", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);

      const result = await doesPathExist(mockApp as any, "nonexistent/path");

      expect(result).toBe(false);
      expect(mockApp.vault.adapter.exists).toHaveBeenCalledWith(
        "nonexistent/path",
      );
    });

    it("should handle empty path", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);

      const result = await doesPathExist(mockApp as any, "");

      expect(result).toBe(false);
    });
  });

  describe("isPathAFolder", () => {
    it("should return true if path is a folder", async () => {
      mockApp.vault.adapter.stat.mockResolvedValue({ type: "folder" });

      const result = await isPathAFolder(mockApp as any, "some/folder");

      expect(result).toBe(true);
      expect(mockApp.vault.adapter.stat).toHaveBeenCalledWith("some/folder");
    });

    it("should return false if path is a file", async () => {
      mockApp.vault.adapter.stat.mockResolvedValue({ type: "file" });

      const result = await isPathAFolder(mockApp as any, "some/file.md");

      expect(result).toBe(false);
      expect(mockApp.vault.adapter.stat).toHaveBeenCalledWith("some/file.md");
    });

    it("should return false if stat returns null", async () => {
      mockApp.vault.adapter.stat.mockResolvedValue(null);

      const result = await isPathAFolder(mockApp as any, "some/path");

      expect(result).toBe(false);
    });
  });

  describe("createFolder", () => {
    it("should return true if folder already exists", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.stat.mockResolvedValue({ type: "folder" });

      const result = await createFolder(mockApp as any, "existing/folder");

        it('should throw error if path exists but is not a folder', async () => {
            mockApp.vault.adapter.exists.mockImplementation(async (path: string) => path === 'some' || path === 'some/file.md');
            mockApp.vault.adapter.stat.mockImplementation(async (path: string) => path === 'some' ? { type: 'folder' } : { type: 'file' });

    it("should create folder if it does not exist", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.createFolder.mockResolvedValue(undefined);

      const result = await createFolder(mockApp as any, "new/folder");

      expect(result).toBe(true);
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith("new/folder");
    });

    it("should throw error if path exists but is not a folder", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.stat.mockResolvedValue({ type: "file" });

      await expect(
        createFolder(mockApp as any, "some/file.md"),
      ).rejects.toThrow("Path exists but is not a folder: some/file.md");
    });

    it("should throw error if folder creation fails", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.createFolder.mockRejectedValue(
        new Error("Permission denied"),
      );

      await expect(createFolder(mockApp as any, "new/folder")).rejects.toThrow(
        "Failed to create folder at new/folder: Permission denied",
      );
    });
  });

  describe("sanitizeFileName", () => {
    it("should remove invalid characters", () => {
      const fileName = "Test/File:Name*With?Invalid<Chars>|#%&{}$!@'`+=";
      const result = sanitizeFileName(fileName);

      expect(result).toBe("TestFileNameWithInvalidChars");
    });

    it("should handle normal file names", () => {
      const fileName = "Normal File Name";
      const result = sanitizeFileName(fileName);

      expect(result).toBe("Normal File Name");
    });

    it("should return default name for empty string", () => {
      const result = sanitizeFileName("");

      expect(result).toBe("Unnamed_Raindrop");
    });

    it("should return default name for whitespace-only string", () => {
      const result = sanitizeFileName("   ");

      expect(result).toBe("Unnamed_Raindrop");
    });

    it("should return default name if sanitization results in empty string", () => {
      const result = sanitizeFileName("///:::***");

      expect(result).toBe("Unnamed_Raindrop");
    });

    it("should truncate long file names to 200 characters", () => {
      const longName = "a".repeat(250);
      const result = sanitizeFileName(longName);

      expect(result.length).toBe(200);
      expect(result).toBe("a".repeat(200));
    });

    it("should handle file names with mixed valid and invalid characters", () => {
      const fileName = "My Article: A Deep Dive (2024) #tech";
      const result = sanitizeFileName(fileName);

      expect(result).toBe("My Article A Deep Dive (2024) tech");
    });

    it("should handle unicode characters", () => {
      const fileName = "Café München 東京";
      const result = sanitizeFileName(fileName);

      expect(result).toBe("Café München 東京");
    });

    it("should trim whitespace", () => {
      const fileName = "  Trimmed Name  ";
      const result = sanitizeFileName(fileName);

      expect(result).toBe("Trimmed Name");
    });
  });

  describe("createFolderStructure", () => {
    it("should return true for empty path", async () => {
      const result = await createFolderStructure(mockApp as any, "");

      expect(result).toBe(true);
      expect(mockApp.vault.createFolder).not.toHaveBeenCalled();
    });

    it("should return true for root path", async () => {
      const result = await createFolderStructure(mockApp as any, "/");

      expect(result).toBe(true);
      expect(mockApp.vault.createFolder).not.toHaveBeenCalled();
    });

    it("should return true if folder already exists", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.stat.mockResolvedValue({ type: "folder" });

      const result = await createFolderStructure(
        mockApp as any,
        "existing/folder",
      );

      expect(result).toBe(true);
      expect(mockApp.vault.createFolder).not.toHaveBeenCalled();
    });

    it("should create single-level folder", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.createFolder.mockResolvedValue(undefined);

      const result = await createFolderStructure(mockApp as any, "folder");

      expect(result).toBe(true);
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith("folder");
    });

    it("should create nested folder structure", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.createFolder.mockResolvedValue(undefined);

      const result = await createFolderStructure(mockApp as any, "a/b/c");

      expect(result).toBe(true);
      // Should create parent folders first
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith("a");
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith("a/b");
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith("a/b/c");
    });

        it('should throw error if path exists but is not a folder', async () => {
            mockApp.vault.adapter.exists.mockImplementation(async (path: string) => path === 'some' || path === 'some/file.md');
            mockApp.vault.adapter.stat.mockImplementation(async (path: string) => path === 'some' ? { type: 'folder' } : { type: 'file' });

    it("should throw error if path exists but is not a folder", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(true);
      mockApp.vault.adapter.stat.mockResolvedValue({ type: "file" });

      await expect(
        createFolderStructure(mockApp as any, "some/file.md"),
      ).rejects.toThrow("Path exists but is not a folder: some/file.md");
    });

    it("should throw error if folder creation fails", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.createFolder.mockRejectedValue(new Error("Disk full"));

      await expect(
        createFolderStructure(mockApp as any, "new/folder"),
      ).rejects.toThrow("Failed to create/verify folder: new/folder");
    });

    it("should handle deep nesting", async () => {
      mockApp.vault.adapter.exists.mockResolvedValue(false);
      mockApp.vault.createFolder.mockResolvedValue(undefined);

      const deepPath = "a/b/c/d/e/f/g";
      const result = await createFolderStructure(mockApp as any, deepPath);

      expect(result).toBe(true);
      // Should create all levels
      expect(mockApp.vault.createFolder).toHaveBeenCalledTimes(7);
    });
  });
});
