/**
 * Tests for Email Template Utilities
 * Includes both unit tests and property-based tests for file count utility
 */

import { countEmailFiles, FileCountResult } from './email-template.utilities';

describe('countEmailFiles - Unit Tests', () => {
  describe('Edge Cases: Null and Undefined', () => {
    it('should return 0 files for null project', () => {
      const result = countEmailFiles(null);

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });

    it('should return 0 files for undefined project', () => {
      const result = countEmailFiles(undefined);

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });

    it('should return 0 files for project with undefined files', () => {
      const result = countEmailFiles({ files: undefined });

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });

    it('should return 0 files for project with null files', () => {
      const result = countEmailFiles({ files: null });

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });

    it('should return 0 files for project with undefined attachments', () => {
      const result = countEmailFiles({ attachments: undefined });

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });

    it('should return 0 files for project with null attachments', () => {
      const result = countEmailFiles({ attachments: null });

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });
  });

  describe('Empty Arrays', () => {
    it('should return 0 files for empty files array', () => {
      const result = countEmailFiles({ files: [] });

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });

    it('should return 0 files for empty attachments array', () => {
      const result = countEmailFiles({ attachments: [] });

      expect(result.count).toBe(0);
      expect(result.files).toEqual([]);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toBe('No files included');
    });
  });

  describe('Single File', () => {
    it('should return 1 file with singular display text', () => {
      const result = countEmailFiles({
        files: [{ filename: 'document.pdf' }],
      });

      expect(result.count).toBe(1);
      expect(result.files).toEqual([{ name: 'document.pdf' }]);
      expect(result.hasFiles).toBe(true);
      expect(result.displayText).toBe('1 file');
    });

    it('should use name property if filename is missing', () => {
      const result = countEmailFiles({
        files: [{ name: 'image.png' }],
      });

      expect(result.count).toBe(1);
      expect(result.files).toEqual([{ name: 'image.png' }]);
      expect(result.displayText).toBe('1 file');
    });

    it('should use default name if both filename and name are missing', () => {
      const result = countEmailFiles({
        files: [{ size: 1024 }],
      });

      expect(result.count).toBe(1);
      expect(result.files).toEqual([{ name: 'Unnamed file', size: 1024 }]);
      expect(result.displayText).toBe('1 file');
    });

    it('should include file size when available', () => {
      const result = countEmailFiles({
        files: [{ filename: 'data.xlsx', size: 2048 }],
      });

      expect(result.files).toEqual([{ name: 'data.xlsx', size: 2048 }]);
    });
  });

  describe('Multiple Files', () => {
    it('should return 5 files with plural display text', () => {
      const result = countEmailFiles({
        files: [
          { filename: 'file1.pdf' },
          { filename: 'file2.xlsx' },
          { filename: 'file3.docx' },
          { filename: 'file4.png' },
          { filename: 'file5.jpg' },
        ],
      });

      expect(result.count).toBe(5);
      expect(result.hasFiles).toBe(true);
      expect(result.displayText).toBe('5 files');
      expect(result.files.length).toBe(5);
    });

    it('should return correct count for 10 files', () => {
      const result = countEmailFiles({
        files: Array.from({ length: 10 }, (_, i) => ({
          filename: `file${i}.txt`,
        })),
      });

      expect(result.count).toBe(10);
      expect(result.displayText).toBe('10 files');
    });

    it('should return correct count for 2 files with plural text', () => {
      const result = countEmailFiles({
        files: [{ filename: 'file1.pdf' }, { filename: 'file2.pdf' }],
      });

      expect(result.count).toBe(2);
      expect(result.displayText).toBe('2 files');
    });
  });

  describe('Mixed Valid and Invalid Entries', () => {
    it('should filter out null entries and count only valid objects', () => {
      const result = countEmailFiles({
        files: [
          { filename: 'file1.pdf' },
          null,
          { filename: 'file2.xlsx' },
          undefined,
          { filename: 'file3.docx' },
        ],
      });

      expect(result.count).toBe(3);
      expect(result.displayText).toBe('3 files');
      expect(result.files.length).toBe(3);
    });

    it('should filter out primitive values', () => {
      const result = countEmailFiles({
        files: [
          { filename: 'file1.pdf' },
          'string',
          123,
          true,
          { filename: 'file2.xlsx' },
        ],
      });

      expect(result.count).toBe(2);
      expect(result.displayText).toBe('2 files');
    });

    it('should handle array containing only invalid entries', () => {
      const result = countEmailFiles({
        files: [null, undefined, 'string', 123],
      });

      expect(result.count).toBe(0);
      expect(result.displayText).toBe('No files included');
    });
  });

  describe('Files vs Attachments Properties', () => {
    it('should prefer files property over attachments', () => {
      const result = countEmailFiles({
        files: [{ filename: 'file1.pdf' }, { filename: 'file2.pdf' }],
        attachments: [{ filename: 'attach1.pdf' }],
      });

      expect(result.count).toBe(2);
      expect(result.files[0].name).toBe('file1.pdf');
    });

    it('should use attachments when files is missing', () => {
      const result = countEmailFiles({
        attachments: [
          { filename: 'attach1.pdf' },
          { filename: 'attach2.docx' },
        ],
      });

      expect(result.count).toBe(2);
      expect(result.displayText).toBe('2 files');
    });
  });

  describe('File Name Extraction Priority', () => {
    it('should prefer filename over name property', () => {
      const result = countEmailFiles({
        files: [{ filename: 'priority.pdf', name: 'fallback.pdf' }],
      });

      expect(result.files[0].name).toBe('priority.pdf');
    });

    it('should use name when filename is missing', () => {
      const result = countEmailFiles({
        files: [{ name: 'document.docx' }],
      });

      expect(result.files[0].name).toBe('document.docx');
    });

    it('should use default when both filename and name are missing', () => {
      const result = countEmailFiles({
        files: [{ size: 512 }],
      });

      expect(result.files[0].name).toBe('Unnamed file');
    });
  });

  describe('Display Text Format', () => {
    it('should show "No files included" for 0 files', () => {
      const result = countEmailFiles({ files: [] });
      expect(result.displayText).toBe('No files included');
    });

    it('should show singular "1 file" for one file', () => {
      const result = countEmailFiles({
        files: [{ filename: 'test.pdf' }],
      });
      expect(result.displayText).toBe('1 file');
    });

    it('should show plural "X files" for multiple files', () => {
      const result = countEmailFiles({
        files: [
          { filename: 'file1.pdf' },
          { filename: 'file2.pdf' },
          { filename: 'file3.pdf' },
        ],
      });
      expect(result.displayText).toBe('3 files');
    });
  });

  describe('Return Value Structure', () => {
    it('should always return FileCountResult with all required properties', () => {
      const result = countEmailFiles(null);

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('hasFiles');
      expect(result).toHaveProperty('displayText');
    });

    it('should return hasFiles boolean that matches count', () => {
      const resultEmpty = countEmailFiles({ files: [] });
      const resultFull = countEmailFiles({
        files: [{ filename: 'test.pdf' }],
      });

      expect(resultEmpty.hasFiles).toBe(false);
      expect(resultFull.hasFiles).toBe(true);
    });

    it('should return files array in correct format', () => {
      const result = countEmailFiles({
        files: [
          { filename: 'doc.pdf', size: 1024 },
          { name: 'image.png' },
        ],
      });

      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files[0]).toHaveProperty('name');
      expect(result.files[0]).toHaveProperty('size');
      expect(result.files[1]).toHaveProperty('name');
    });
  });
});

describe('countEmailFiles - Parameterized Property-Based Tests', () => {
  /**
   * Property 8: Accurate File Count from Project Object
   * Validates: Requirements 3.1, 3.2, 3.3, 3.5
   *
   * For any project or delivery object with a files array, calling countEmailFiles()
   * SHALL return a count equal to the number of valid file objects in the array,
   * and the displayText SHALL match the expected format.
   */
  it('Property 8: Accurate File Count from Project Object', () => {
    // Test cases: 0, 1, 2, 5, 10, 50, 100 files
    const fileCounts = [0, 1, 2, 5, 10, 50, 100];

    fileCounts.forEach((count) => {
      const files = Array.from({ length: count }, (_, i) => ({
        filename: `file${i}.pdf`,
        size: Math.random() * 1000000,
      }));

      const result = countEmailFiles({ files });

      // Count should match array length
      expect(result.count).toBe(files.length);

      // hasFiles should match count
      expect(result.hasFiles).toBe(files.length > 0);

      // displayText format should be correct
      if (files.length === 0) {
        expect(result.displayText).toBe('No files included');
      } else if (files.length === 1) {
        expect(result.displayText).toBe('1 file');
      } else {
        expect(result.displayText).toBe(`${files.length} files`);
      }

      // files array should have correct length
      expect(result.files.length).toBe(files.length);
    });
  });

  /**
   * Property 9: File Count Zero Handling
   * Validates: Requirements 3.4
   *
   * For any project or delivery object with zero files (null, undefined, or empty array),
   * calling countEmailFiles() SHALL return an object with count === 0 and
   * displayText containing the phrase "No files".
   */
  it('Property 9: File Count Zero Handling', () => {
    const zeroFileScenarios = [
      null,
      undefined,
      { files: null },
      { files: undefined },
      { files: [] },
      { attachments: null },
      { attachments: undefined },
      { attachments: [] },
      { files: null, attachments: null },
    ];

    zeroFileScenarios.forEach((scenario) => {
      const result = countEmailFiles(scenario as any);

      expect(result.count).toBe(0);
      expect(result.hasFiles).toBe(false);
      expect(result.displayText).toContain('No files');
    });
  });

  /**
   * Test: File count with mixed valid/invalid entries
   * Verifies that invalid entries (null, primitives) are filtered out
   * and only valid objects are counted.
   */
  it('should handle mixed valid/invalid entries correctly', () => {
    // Test case 1: Mix of valid and null
    const mixedArray1 = [
      { filename: 'file1.pdf' },
      null,
      { filename: 'file2.xlsx' },
      undefined,
      { filename: 'file3.docx' },
    ];
    const result1 = countEmailFiles({ files: mixedArray1 });
    expect(result1.count).toBe(3);
    expect(result1.files.length).toBe(3);

    // Test case 2: Mix of valid and primitives
    const mixedArray2 = [
      { filename: 'file1.pdf' },
      'string',
      123,
      true,
      { filename: 'file2.xlsx' },
    ];
    const result2 = countEmailFiles({ files: mixedArray2 });
    expect(result2.count).toBe(2);
    expect(result2.files.length).toBe(2);

    // Test case 3: Only invalid entries
    const mixedArray3 = [null, undefined, 'string', 123, false];
    const result3 = countEmailFiles({ files: mixedArray3 });
    expect(result3.count).toBe(0);
    expect(result3.files.length).toBe(0);
  });

  /**
   * Test: Display text consistency with count
   * Verifies that displayText format is always consistent with file count.
   */
  it('should generate consistent displayText based on count', () => {
    const testCases = [
      { count: 0, expectedText: 'No files included' },
      { count: 1, expectedText: '1 file' },
      { count: 2, expectedText: '2 files' },
      { count: 5, expectedText: '5 files' },
      { count: 10, expectedText: '10 files' },
      { count: 100, expectedText: '100 files' },
    ];

    testCases.forEach(({ count, expectedText }) => {
      const files = Array.from({ length: count }, (_, i) => ({
        filename: `file${i}.pdf`,
      }));

      const result = countEmailFiles({ files });
      expect(result.displayText).toBe(expectedText);
    });
  });

  /**
   * Test: File name extraction fallback chain
   * Verifies that the function prefers filename > name > default
   */
  it('should extract filenames with correct priority', () => {
    // Test case 1: Has filename (highest priority)
    const result1 = countEmailFiles({
      files: [{ filename: 'priority.pdf', name: 'fallback.pdf' }],
    });
    expect(result1.files[0].name).toBe('priority.pdf');

    // Test case 2: Has name but no filename
    const result2 = countEmailFiles({
      files: [{ name: 'document.docx' }],
    });
    expect(result2.files[0].name).toBe('document.docx');

    // Test case 3: Has neither filename nor name (use default)
    const result3 = countEmailFiles({
      files: [{ size: 1024 }],
    });
    expect(result3.files[0].name).toBe('Unnamed file');

    // Test case 4: Empty object (use default)
    const result4 = countEmailFiles({
      files: [{}],
    });
    expect(result4.files[0].name).toBe('Unnamed file');
  });
});
