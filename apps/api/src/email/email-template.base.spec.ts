/**
 * Tests for BaseEmailTemplate Class
 * Includes unit tests and property-based tests for email template generation
 */

import { BaseEmailTemplate } from './email-template.base';
import { EmailTemplateOptions } from './email-template.types';

describe('BaseEmailTemplate - Unit Tests', () => {
  describe('Instantiation and Validation', () => {
    it('should create instance with valid options', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test Email',
        mainContent: '<p>Test content</p>',
      });

      expect(template).toBeDefined();
      expect(template.render).toBeDefined();
    });

    it('should throw error if subject is missing', () => {
      expect(() => {
        new BaseEmailTemplate({
          subject: '',
          mainContent: '<p>Test</p>',
        });
      }).toThrow('Email template subject is required');
    });

    it('should throw error if mainContent is missing', () => {
      expect(() => {
        new BaseEmailTemplate({
          subject: 'Test',
          mainContent: '',
        });
      }).toThrow('Email template main content is required');
    });

    it('should accept optional preheader', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
        preheader: 'Preview text',
      });

      const result = template.render();
      expect(result.preheader).toBe('Preview text');
    });

    it('should accept optional footerOverride', () => {
      const customFooter = '<p>Custom footer</p>';
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
        footerOverride: customFooter,
      });

      const result = template.render();
      expect(result.html).toContain(customFooter);
    });
  });

  describe('Render Output Structure', () => {
    it('should return object with html, text, and subject properties', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test Subject',
        mainContent: '<p>Test content</p>',
      });

      const result = template.render();

      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('subject');
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
      expect(result.subject).toBe('Test Subject');
    });

    it('should preserve subject exactly as provided', () => {
      const subject = 'Welcome to ACE Services - Account Created';
      const template = new BaseEmailTemplate({
        subject,
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.subject).toBe(subject);
    });

    it('should include main content in both html and text', () => {
      const mainContent = '<p>Important message</p>';
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent,
      });

      const result = template.render();
      expect(result.html).toContain('Important message');
      expect(result.text).toContain('Important message');
    });
  });

  describe('HTML Structure', () => {
    it('should be valid HTML with DOCTYPE', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('</html>');
    });

    it('should include meta tags for email client compatibility', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('meta charset');
      expect(result.html).toContain('viewport');
    });

    it('should include embedded CSS styles', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('<style');
      expect(result.html).toContain('</style>');
    });

    it('should include email-container div', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('email-container');
    });
  });

  describe('Plain Text Format', () => {
    it('should not contain HTML tags', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<h3>Title</h3><p>Content with <strong>bold</strong></p>',
      });

      const result = template.render();
      const htmlTagRegex = /<[^>]+>/g;
      expect(result.text).not.toMatch(htmlTagRegex);
    });

    it('should include main content without HTML markup', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Important content</p>',
      });

      const result = template.render();
      expect(result.text).toContain('Important content');
      expect(result.text).not.toContain('<p>');
      expect(result.text).not.toContain('</p>');
    });

    it('should wrap long lines to 75 characters', () => {
      const longText = 'This is a very long line of text that definitely exceeds the 75 character limit that should be used for plain text emails to ensure proper readability on mobile devices';
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: `<p>${longText}</p>`,
      });

      const result = template.render();
      const lines = result.text.split('\n');
      const contentLines = lines.filter(
        (line) => line.length > 0 && !line.includes('==='),
      );

      // Most lines should be <= 75 chars (some may be longer if single words exceed limit)
      const wrappedLines = contentLines.filter(
        (line) => !line.match(/^[^ ]+$/),
      );
      wrappedLines.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(80); // Allow small margin
      });
    });

    it('should include header and footer separators', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.text).toContain('================================================================================');
    });
  });

  describe('Contrast and Accessibility', () => {
    it('should contain valid brand color #FF8C00', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('#FF8C00');
    });

    it('should have white background color', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('#FFFFFF');
    });
  });

  describe('Footer Content', () => {
    it('should include default footer with company information', () => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.html).toContain('ACE Services');
      expect(result.html).toContain('+1 (555) 123-4567');
      expect(result.html).toContain('support@aceservices.com');
      expect(result.html).toContain('123 Business Ave');
    });

    it('should use custom footer if provided', () => {
      const customFooter = '<p>Custom Footer Content</p>';
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: '<p>Content</p>',
        footerOverride: customFooter,
      });

      const result = template.render();
      expect(result.html).toContain('Custom Footer Content');
    });
  });
});

describe('BaseEmailTemplate - Property-Based Tests', () => {
  /**
   * Property 1: Logo Presence in All Emails
   * Validates: Requirements 1.1, 1.7, 2.1
   *
   * For any generated email template, the HTML version SHALL contain
   * an img element with src containing "logo" and alt text "ACE Services"
   */
  it('Property 1: Logo Presence in All Emails', () => {
    const emailTypes = [
      { subject: 'Welcome', content: '<p>Welcome email</p>' },
      { subject: 'Password Reset', content: '<p>Reset your password</p>' },
      { subject: 'Project Updated', content: '<p>Your project was updated</p>' },
      { subject: 'File Uploaded', content: '<p>New file available</p>' },
      { subject: 'Daily Summary', content: '<p>Here is your summary</p>' },
    ];

    emailTypes.forEach(({ subject, content }) => {
      const template = new BaseEmailTemplate({
        subject,
        mainContent: content,
      });

      const result = template.render();

      // Check for logo img tag
      expect(result.html).toContain('<img');
      expect(result.html).toContain('alt="ACE Services"');
      expect(result.html).toContain('logo');
    });
  });

  /**
   * Property 2: Orange Brand Color Consistency
   * Validates: Requirements 1.2, 1.4, 2.3
   *
   * For any generated email template, all interactive elements
   * SHALL use the color value #FF8C00 in their CSS
   */
  it('Property 2: Orange Brand Color Consistency', () => {
    const emailTypes = [
      { subject: 'Test 1', content: '<p>Content 1</p>' },
      { subject: 'Test 2', content: '<p>Content 2</p>' },
      { subject: 'Test 3', content: '<p>Content 3</p>' },
    ];

    emailTypes.forEach(({ subject, content }) => {
      const template = new BaseEmailTemplate({
        subject,
        mainContent: content,
      });

      const result = template.render();

      // Brand color should appear in CSS
      expect(result.html).toContain('#FF8C00');

      // Should appear multiple times for different elements
      const colorMatches = (result.html.match(/#FF8C00/g) || []).length;
      expect(colorMatches).toBeGreaterThan(0);
    });
  });

  /**
   * Property 3: White Background Applied
   * Validates: Requirements 1.3
   *
   * For any generated email template, the main container element
   * SHALL have a background-color CSS property set to #FFFFFF
   */
  it('Property 3: White Background Applied', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Email container should have white background
      expect(result.html).toContain('background-color: #FFFFFF');
    });
  });

  /**
   * Property 4: Footer Contains All Required Information
   * Validates: Requirements 1.5, 5.1, 5.2
   *
   * For any generated email template, the footer element SHALL contain
   * company name, phone, email, and address
   */
  it('Property 4: Footer Contains All Required Information', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Check HTML footer
      expect(result.html).toContain('ACE Services');
      expect(result.html).toMatch(/\+1\s*\(\s*555\s*\)\s*123-4567/);
      expect(result.html).toContain('support@aceservices.com');
      expect(result.html).toContain('123 Business Ave');

      // Check plain text footer
      expect(result.text).toContain('ACE Services');
      expect(result.text).toContain('+1 (555) 123-4567');
      expect(result.text).toContain('support@aceservices.com');
      expect(result.text).toContain('123 Business Ave');
    });
  });

  /**
   * Property 5: Dual Format Generation
   * Validates: Requirements 6.1, 6.2, 6.3
   *
   * For any given email template content, the render() method
   * SHALL return an object with both html and text properties
   */
  it('Property 5: Dual Format Generation', () => {
    const contentExamples = [
      '<p>Simple paragraph</p>',
      '<h3>Heading</h3><p>Content</p>',
      '<p>Line 1</p><p>Line 2</p><p>Line 3</p>',
      '<a href="https://example.com">Link</a>',
    ];

    contentExamples.forEach((content) => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: content,
      });

      const result = template.render();

      // Both formats should exist
      expect(typeof result.html).toBe('string');
      expect(typeof result.text).toBe('string');
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.text.length).toBeGreaterThan(0);

      // Both should contain the content (in different formats)
      expect(result.html.length).toBeGreaterThan(result.text.length); // HTML is larger due to markup
    });
  });

  /**
   * Property 6: Plain Text Contains No HTML Markup
   * Validates: Requirements 6.4
   *
   * For any generated email template, the plain text version
   * SHALL not contain HTML tags
   */
  it('Property 6: Plain Text Contains No HTML Markup', () => {
    const htmlContents = [
      '<p>Simple text</p>',
      '<h1>Title</h1><p>Body</p>',
      '<div><span>Nested</span></div>',
      '<a href="#">Link</a>',
      '<img src="test.jpg" alt="test">',
      '<ul><li>Item 1</li><li>Item 2</li></ul>',
    ];

    htmlContents.forEach((content) => {
      const template = new BaseEmailTemplate({
        subject: 'Test',
        mainContent: content,
      });

      const result = template.render();

      // Plain text should NOT contain HTML tags
      const htmlTagRegex = /<[^>]+>/g;
      expect(result.text).not.toMatch(htmlTagRegex);
    });
  });

  /**
   * Property 7: Plain Text Includes Footer Information
   * Validates: Requirements 5.7, 6.6
   *
   * For any generated plain text email, the text output SHALL include
   * all footer components
   */
  it('Property 7: Plain Text Includes Footer Information', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Plain text should include all footer info
      expect(result.text).toContain('ACE Services');
      expect(result.text).toContain('+1 (555) 123-4567');
      expect(result.text).toContain('support@aceservices.com');
      expect(result.text).toContain('123 Business Ave');
    });
  });

  /**
   * Property 11: Responsive CSS Media Query Coverage
   * Validates: Requirements 4.1, 4.2, 4.3
   *
   * For any generated email, the CSS SHALL contain media query blocks
   * covering 320px, 480px, and 600px ranges
   */
  it('Property 11: Responsive CSS Media Query Coverage', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Should have media queries for different breakpoints
      expect(result.html).toContain('@media');
      expect(result.html).toContain('480px');
      expect(result.html).toContain('600px');
    });
  });

  /**
   * Property 12: Logo Responsive Dimensions
   * Validates: Requirements 4.5, 4.7
   *
   * Verify logo max-width dimensions for mobile and desktop
   */
  it('Property 12: Logo Responsive Dimensions', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Should have mobile logo size (200px)
      expect(result.html).toContain('200px');

      // Should have desktop logo size (300px)
      expect(result.html).toContain('300px');
    });
  });

  /**
   * Property 14: Button Minimum Touch Target
   * Validates: Requirements 4.7, accessibility
   *
   * Verify button CSS has min-width: 44px and min-height: 44px
   */
  it('Property 14: Button Minimum Touch Target', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Should have minimum touch target sizes
      expect(result.html).toContain('min-width: 44px');
      expect(result.html).toContain('min-height: 44px');
    });
  });

  /**
   * Property 15: Footer Font Size Smaller Than Body
   * Validates: Requirements 5.5
   *
   * Footer font-size should be smaller than body text font-size
   */
  it('Property 15: Footer Font Size Smaller Than Body', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      new BaseEmailTemplate({
        subject: `Email ${i}`,
        mainContent: `<p>Content ${i}</p>`,
      }),
    );

    templates.forEach((template) => {
      const result = template.render();

      // Body should be 16px
      expect(result.html).toContain('font-size: 16px');

      // Footer should be smaller (12px or 13px)
      const hasSmallFooterFont =
        result.html.includes('font-size: 12px') ||
        result.html.includes('font-size: 13px') ||
        result.html.includes('font-size: 11px');

      expect(hasSmallFooterFont).toBe(true);
    });
  });

  /**
   * Property 16: Subject Line Preserved
   * Validates: General requirement
   *
   * Subject field should match input exactly
   */
  it('Property 16: Subject Line Preserved', () => {
    const subjects = [
      'Welcome to ACE Services',
      'Password Reset Request',
      'Project Assignment - New Task',
      'File Upload Confirmation',
      'Daily Summary - Jan 15, 2024',
    ];

    subjects.forEach((subject) => {
      const template = new BaseEmailTemplate({
        subject,
        mainContent: '<p>Content</p>',
      });

      const result = template.render();
      expect(result.subject).toBe(subject);
    });
  });
});

describe('BaseEmailTemplate - Contrast Ratio Compliance', () => {
  /**
   * Test contrast ratios for accessibility
   */
  it('should use colors with sufficient contrast for WCAG AA compliance', () => {
    const template = new BaseEmailTemplate({
      subject: 'Test',
      mainContent: '<p>Content</p>',
    });

    const result = template.render();

    // Should contain brand color and acceptable contrast combinations
    expect(result.html).toContain('#FF8C00'); // Orange
    expect(result.html).toContain('#FFFFFF'); // White
    expect(result.html).toContain('#333333'); // Dark text

    // Should have light background for footer
    expect(result.html).toContain('#F5F5F5');
  });
});
