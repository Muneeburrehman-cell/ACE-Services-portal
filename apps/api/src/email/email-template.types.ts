/**
 * Email Template Types and Interfaces
 * Defines all TypeScript interfaces for the professional email template system
 */

/**
 * Options for creating a new email template
 * Contains all configuration needed to generate HTML and plain text versions
 */
export interface EmailTemplateOptions {
  /**
   * The subject line for the email
   * Required - will throw validation error if missing
   */
  subject: string;

  /**
   * Optional preview text shown in email clients before opening
   * Provides context for recipient about email content
   */
  preheader?: string;

  /**
   * The main email content as HTML
   * Required - will throw validation error if missing
   * Can contain HTML formatting, but will be wrapped in template structure
   */
  mainContent: string;

  /**
   * Optional custom footer to override the default company footer
   * If provided, replaces the standard footer with custom content
   */
  footerOverride?: string;

  /**
   * Internal flag indicating whether rendering for plain text version
   * Used during render process to control output format
   */
  isPlainText?: boolean;

  /**
   * Optional brand color override to customize email styling
   * Defaults to #FF8C00 (orange) if not provided
   */
  brandColor?: string;
}

/**
 * Output structure from BaseEmailTemplate.render()
 * Contains both HTML and plain text versions of the email
 */
export interface BaseTemplateOutput {
  /**
   * Complete HTML version of the email with template styling
   * Includes responsive CSS, header with logo, content, and footer
   * Ready to send via email provider
   */
  html: string;

  /**
   * Complete plain text version of the email
   * Includes all content without HTML markup
   * Ready to send as email fallback format
   */
  text: string;

  /**
   * The email subject line
   * Preserved exactly as provided in EmailTemplateOptions
   */
  subject: string;

  /**
   * Optional preview text for email client display
   * Included if provided in EmailTemplateOptions
   */
  preheader?: string;
}

/**
 * Result from countEmailFiles() utility function
 * Provides detailed file count information for template rendering
 */
export interface FileCountResult {
  /**
   * Total number of valid file objects found
   * Counts only objects with valid file properties
   */
  count: number;

  /**
   * Array of file objects with normalized properties
   * Each file includes name and optional size information
   */
  files: Array<{
    /**
     * File name or display name
     * Extracted from filename, name, or defaults to "Unnamed file"
     */
    name: string;

    /**
     * Optional file size in bytes
     * May not be present for all file types
     */
    size?: number;
  }>;

  /**
   * Boolean indicating whether any files were found
   * True if count > 0, false otherwise
   */
  hasFiles: boolean;

  /**
   * Human-readable text describing file count
   * Examples: "No files included", "1 file", "3 files"
   * Suitable for direct use in email templates
   */
  displayText: string;
}

/**
 * Complete result from template generation
 * Similar to BaseTemplateOutput but with optional preheader
 */
export interface TemplatedEmailResult {
  /**
   * Complete HTML version of the email with template styling
   */
  html: string;

  /**
   * Complete plain text version of the email
   */
  text: string;

  /**
   * The email subject line
   */
  subject: string;

  /**
   * Optional preview text for email client display
   */
  preheader?: string;
}
