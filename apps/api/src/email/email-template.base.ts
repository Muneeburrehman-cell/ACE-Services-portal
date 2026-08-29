/**
 * Base Email Template Class
 * Provides professional email template wrapping with consistent branding
 */

import {
  EmailTemplateOptions,
  BaseTemplateOutput,
  TemplatedEmailResult,
} from './email-template.types';

/**
 * BaseEmailTemplate
 *
 * Wraps email content with professional branding including:
 * - ACE Services company logo
 * - Orange brand color (#FF8C00) for interactive elements
 * - White background for main content
 * - Professional footer with company information
 * - Responsive CSS for mobile and desktop devices
 * - Dual HTML and plain text output formats
 *
 * @example
 * const template = new BaseEmailTemplate({
 *   subject: 'Welcome to ACE Services',
 *   mainContent: '<h3>Hello User!</h3><p>Welcome to our platform.</p>',
 *   preheader: 'Get started with ACE Services'
 * });
 * const { html, text, subject } = template.render();
 */
export class BaseEmailTemplate {
  /**
   * URL to the ACE Services logo image
   * Orange-branded company logo positioned at email header
   * @private
   */
  private readonly logoUrl =
    'https://aceservices.com/assets/logo-orange.png';

  /**
   * Primary brand color for interactive elements
   * Used for buttons, links, borders, and highlights
   * @private
   */
  private readonly brandColor = '#FF8C00';

  /**
   * Neutral gray color for secondary text and borders
   * Used for footer text and subtle elements
   * @private
   */
  private readonly neutralGray = '#666666';

  /**
   * Light background color for footer and highlight boxes
   * Used as secondary background to create visual hierarchy
   * @private
   */
  private readonly lightBackground = '#F5F5F5';

  /**
   * White background color for main content area
   * Primary background ensuring readability and professional appearance
   * @private
   */
  private readonly whiteBackground = '#FFFFFF';

  /**
   * Constructor accepting email template configuration
   *
   * @param options - EmailTemplateOptions containing subject, content, and optional styling
   * @throws Error if subject or mainContent is missing
   */
  constructor(private readonly options: EmailTemplateOptions) {
    this.validate();
  }

  /**
   * Generates both HTML and plain text versions of the email
   * Returns a template-wrapped result suitable for multipart MIME emails
   *
   * @returns BaseTemplateOutput with html, text, and subject properties
   *
   * @example
   * const result = template.render();
   * // result.html contains full HTML with template styling
   * // result.text contains plain text version
   * // result.subject contains the email subject
   */
  render(): BaseTemplateOutput {
    const html = this.renderHTML();
    const text = this.renderPlainText();

    return {
      html,
      text,
      subject: this.options.subject,
      preheader: this.options.preheader,
    };
  }

  /**
   * Generates the HTML version of the email
   * Creates complete HTML structure with:
   * - DOCTYPE and meta tags for email clients
   * - Responsive viewport configuration
   * - Embedded responsive CSS
   * - Header with company logo
   * - Main content area
   * - Professional footer
   *
   * @returns Complete HTML string ready for email delivery
   * @private
   */
  private renderHTML(): string {
    const brandColor = this.options.brandColor || this.brandColor;
    const styles = this.getResponsiveStyles(brandColor);

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${this.escapeHtml(this.options.subject)}</title>
    ${styles}
  </head>
  <body style="margin: 0; padding: 0; background-color: ${this.lightBackground}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div class="email-container">
      <!-- Header with Logo -->
      <div class="email-header">
        <img 
          src="${this.logoUrl}" 
          alt="ACE Services" 
          class="email-logo"
          style="max-width: 300px; height: auto; display: block; margin: 0 auto;"
        >
      </div>

      <!-- Main Content -->
      <div class="email-content">
        ${this.options.mainContent}
      </div>

      <!-- Footer -->
      <div class="email-footer">
        ${this.options.footerOverride || this.getDefaultFooter()}
      </div>
    </div>
  </body>
</html>`;
  }

  /**
   * Generates the plain text version of the email
   * Creates plain text representation with:
   * - All HTML content converted to text
   * - Proper line breaks and spacing
   * - Text-formatted header
   * - Text-formatted footer
   * - Line length optimized for mobile reading (75 chars max)
   *
   * @returns Complete plain text string ready for email delivery
   * @private
   */
  private renderPlainText(): string {
    // Strip HTML tags from main content
    const strippedContent = this.stripHtml(this.options.mainContent);

    // Create plain text header
    const header = '================================================================================\n'
      + '                            ACE SERVICES\n'
      + '================================================================================\n\n';

    // Create plain text footer
    const footer = this.getPlainTextFooter();

    // Combine all sections
    const plainText = header
      + strippedContent
      + '\n\n'
      + footer;

    return plainText;
  }

  /**
   * Validates that all required template options are provided
   * Throws validation errors for missing required fields
   *
   * @throws Error if subject or mainContent is missing
   * @private
   */
  private validate(): void {
    if (!this.options.subject || this.options.subject.trim() === '') {
      throw new Error('Email template subject is required');
    }

    if (!this.options.mainContent || this.options.mainContent.trim() === '') {
      throw new Error('Email template main content is required');
    }
  }

  /**
   * Returns responsive CSS styles embedded in a style tag
   * Includes mobile-first media queries for different screen sizes
   *
   * @param brandColor - Brand color to use in styles
   * @returns Style tag with complete CSS
   * @private
   */
  private getResponsiveStyles(brandColor: string): string {
    return `<style type="text/css">
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .email-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: ${this.whiteBackground};
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333333;
      }

      .email-header {
        background-color: ${this.whiteBackground};
        text-align: center;
        padding: 24px;
        border-bottom: 3px solid ${brandColor};
      }

      .email-logo {
        max-width: 300px;
        height: auto;
        display: block;
        margin: 0 auto;
      }

      .email-content {
        padding: 24px;
        background-color: ${this.whiteBackground};
      }

      .email-content h1,
      .email-content h2,
      .email-content h3 {
        color: #333333;
        margin-bottom: 16px;
      }

      .email-content h1 {
        font-size: 24px;
      }

      .email-content h2 {
        font-size: 20px;
      }

      .email-content h3 {
        font-size: 18px;
      }

      .email-content p {
        margin-bottom: 16px;
        color: #333333;
      }

      .email-content a {
        color: ${brandColor};
        text-decoration: none;
      }

      .email-content a:hover {
        text-decoration: underline;
      }

      .email-button {
        display: inline-block;
        background-color: ${brandColor};
        color: ${this.whiteBackground};
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
        margin: 12px 0;
        min-width: 44px;
        min-height: 44px;
        line-height: 20px;
        text-align: center;
      }

      .email-button:hover {
        opacity: 0.9;
      }

      .email-footer {
        background-color: ${this.lightBackground};
        padding: 20px 24px;
        font-size: 13px;
        color: ${this.neutralGray};
        border-top: 1px solid #E0E0E0;
        text-align: center;
      }

      .email-footer p {
        margin: 0 0 8px 0;
      }

      .email-footer a {
        color: ${brandColor};
        text-decoration: none;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin-bottom: 12px;
        border-left: 4px solid ${brandColor};
        padding-left: 12px;
      }

      .highlight-box {
        background-color: #FFF3E0;
        border-left: 4px solid ${brandColor};
        padding: 12px 16px;
        margin: 12px 0;
        border-radius: 2px;
      }

      /* Mobile optimization (< 480px) */
      @media (max-width: 480px) {
        .email-container {
          width: 100%;
          padding: 0;
        }

        .email-header {
          padding: 16px 12px;
        }

        .email-logo {
          max-width: 200px;
        }

        .email-content {
          padding: 16px 12px;
        }

        .email-footer {
          padding: 12px 12px;
          font-size: 11px;
        }

        .email-button {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 12px 24px;
        }

        .section-title {
          font-size: 16px;
          padding-left: 10px;
        }
      }

      /* Tablet optimization (480px - 600px) */
      @media (min-width: 480px) and (max-width: 600px) {
        .email-container {
          max-width: 100%;
        }

        .email-header {
          padding: 20px 16px;
        }

        .email-logo {
          max-width: 250px;
        }

        .email-content {
          padding: 20px 16px;
        }

        .email-footer {
          padding: 16px 16px;
          font-size: 12px;
        }
      }

      /* Desktop optimization (> 600px) */
      @media (min-width: 600px) {
        .email-container {
          max-width: 600px;
        }

        .email-header {
          padding: 24px 24px;
        }

        .email-logo {
          max-width: 300px;
        }

        .email-content {
          padding: 24px 24px;
        }

        .email-footer {
          padding: 20px 24px;
          font-size: 13px;
        }
      }
    </style>`;
  }

  /**
   * Returns the default company footer HTML
   * Includes company name, phone, email, and address
   *
   * @returns HTML footer content
   * @private
   */
  private getDefaultFooter(): string {
    return `<p style="margin: 0 0 12px 0; font-weight: 600;">ACE Services</p>
<p style="margin: 0 0 8px 0;">📞 <a href="tel:+15551234567">+1 (555) 123-4567</a></p>
<p style="margin: 0 0 8px 0;">📧 <a href="mailto:support@aceservices.com">support@aceservices.com</a></p>
<p style="margin: 0 0 12px 0;">
  123 Business Ave<br>
  Suite 100<br>
  New York, NY 10001
</p>
<p style="margin: 0; font-size: 11px; color: #999999;">© 2024 ACE Services. All rights reserved.</p>`;
  }

  /**
   * Returns the plain text version of the footer
   * Includes company contact information formatted for plain text
   *
   * @returns Plain text footer content
   * @private
   */
  private getPlainTextFooter(): string {
    return `================================================================================

ACE Services
📞 +1 (555) 123-4567
📧 support@aceservices.com

Address:
123 Business Ave
Suite 100
New York, NY 10001

© 2024 ACE Services. All rights reserved.

================================================================================`;
  }

  /**
   * Strips HTML tags from a string
   * Converts HTML to plain text while preserving structure with line breaks
   *
   * @param html - HTML string to strip
   * @returns Plain text version
   * @private
   */
  private stripHtml(html: string): string {
    // Replace common HTML elements with text formatting
    let text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<a\s+href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
      .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

    // Clean up excessive whitespace
    text = text
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();

    // Ensure lines don't exceed 75 characters for mobile readability
    const lines = text.split('\n');
    const wrappedLines = lines.map((line) => this.wrapText(line, 75));

    return wrappedLines.join('\n');
  }

  /**
   * Wraps text to a specific line length
   * Splits long lines while preserving word boundaries
   *
   * @param text - Text to wrap
   * @param maxLength - Maximum line length
   * @returns Wrapped text with line breaks
   * @private
   */
  private wrapText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxLength) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  /**
   * Escapes HTML special characters to prevent injection
   * Converts &, <, >, ", and ' to their HTML entities
   *
   * @param text - Text to escape
   * @returns Escaped HTML text
   * @private
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}
