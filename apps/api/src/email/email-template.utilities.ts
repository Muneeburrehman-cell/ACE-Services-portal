/**
 * Email Template Utilities
 * Contains utility functions for email template generation
 */

/**
 * Result object from file count utility
 */
export interface FileCountResult {
  count: number;
  files: Array<{ name: string; size?: number }>;
  hasFiles: boolean;
  displayText: string;
}

/**
 * Accurately counts files from project or delivery objects
 *
 * Handles edge cases:
 * - null/undefined objects: returns count 0
 * - missing files/attachments arrays: returns count 0
 * - empty arrays: returns count 0
 * - non-array values: returns count 0
 * - invalid file objects: filters out and counts only valid objects
 *
 * @param projectOrDelivery - Project or delivery object with optional files or attachments array
 * @returns FileCountResult with count, files array, hasFiles flag, and displayText
 *
 * @example
 * // With 3 files
 * const result = countEmailFiles({ files: [{ filename: 'doc.pdf' }, { name: 'image.png' }, { filename: 'data.xlsx' }] });
 * // Returns: { count: 3, files: [{ name: 'doc.pdf' }, { name: 'image.png' }, { name: 'data.xlsx' }], hasFiles: true, displayText: '3 files' }
 *
 * @example
 * // With null project
 * const result = countEmailFiles(null);
 * // Returns: { count: 0, files: [], hasFiles: false, displayText: 'No files included' }
 */
export function countEmailFiles(
  projectOrDelivery: any
): FileCountResult {
  // Handle null or undefined input
  if (!projectOrDelivery) {
    return {
      count: 0,
      files: [],
      hasFiles: false,
      displayText: 'No files included',
    };
  }

  // Try to get files array from either files or attachments property
  let fileArray = projectOrDelivery.files || projectOrDelivery.attachments;

  // Ensure we have an array
  if (!Array.isArray(fileArray)) {
    return {
      count: 0,
      files: [],
      hasFiles: false,
      displayText: 'No files included',
    };
  }

  // Filter to only valid file objects (exclude null, undefined, primitives)
  const validFiles = fileArray.filter(
    (f) => f !== null && f !== undefined && typeof f === 'object'
  );

  // Extract file information
  const files = validFiles.map((f) => ({
    name: f.filename || f.name || 'Unnamed file',
    size: f.size,
  }));

  // Generate display text
  const displayText =
    validFiles.length === 0
      ? 'No files included'
      : `${validFiles.length} file${validFiles.length !== 1 ? 's' : ''}`;

  return {
    count: validFiles.length,
    files,
    hasFiles: validFiles.length > 0,
    displayText,
  };
}
