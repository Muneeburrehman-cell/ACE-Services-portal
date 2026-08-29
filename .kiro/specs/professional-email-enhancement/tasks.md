# Implementation Plan: Professional Email Enhancement

## Overview

This implementation plan converts the design into executable coding tasks that create a professional email template system for all 54 email triggers in the ACE Services Portal. The tasks are organized to build incrementally from core infrastructure to trigger integration, with property-based tests validating correctness properties throughout.

---

## Tasks

### Phase 1: Foundation and Core Infrastructure

- [x] 1. Set up email template module structure and TypeScript interfaces
  - Create `email-template.base.ts` file with BaseEmailTemplate class interface
  - Define `EmailTemplateOptions`, `BaseTemplateOutput`, and related TypeScript interfaces
  - Create `email-template.types.ts` file with all type definitions for template system
  - Set up directory structure for template utilities
  - _Requirements: 1.1, 1.3, 1.5, 6.1, 6.3_

- [x] 2. Implement responsive CSS engine with mobile-first design
  - Create `email-template.styles.ts` file containing ResponsiveEmailCSS class
  - Implement `getResponsiveStyles()` static method with complete CSS
  - Include media queries for 320px, 480px, and 600px+ breakpoints
  - Verify orange brand color (#FF8C00) used consistently for interactive elements
  - Test CSS minification and size (target < 3KB)
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7, 2.3, 2.4_

- [x] 3. Implement file count utility function (countEmailFiles)
  - Create `email-template.utilities.ts` file with countEmailFiles function
  - Handle edge cases: null files, undefined, empty arrays, invalid objects
  - Return FileCountResult with count, files array, hasFiles boolean, and displayText
  - Add validation to filter out non-object file entries
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Write property tests for file count utility
  - **Property 8: Accurate File Count from Project Object**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
  - Test countEmailFiles with 0-100 file entries across 100+ random inputs
  - Verify count always matches array length exactly
  - Verify displayText format matches expected patterns
  - Test with null, undefined, empty array inputs
  - Test with mixed valid/invalid file objects
  - _Sub-task*_

- [x] 5. Write unit tests for file count edge cases
  - Test null project object returns 0 files with "No files included" message
  - Test undefined files array returns 0 files
  - Test empty array returns 0 files with correct display text
  - Test single file returns count of 1 with "1 file" (singular)
  - Test multiple files returns correct count with "X files" (plural)
  - Test objects with both files and attachments properties
  - _Sub-task*_

- [x] 6. Checkpoint - Verify foundation infrastructure
  - Ensure all interfaces compile without errors
  - Verify CSS is syntactically valid and loads correctly
  - Verify file count utility passes all unit and property tests
  - Ask the user if questions arise before proceeding to BaseEmailTemplate implementation

### Phase 2: BaseEmailTemplate Core Implementation

- [x] 7. Implement BaseEmailTemplate HTML rendering method
  - Create implementation of `renderHTML()` private method in BaseEmailTemplate class
  - Generate complete HTML structure with DOCTYPE, meta tags, responsive viewport
  - Embed responsive CSS using ResponsiveEmailCSS.getResponsiveStyles()
  - Include email header with logo image and alt text "ACE Services"
  - Include content area for main email content
  - Include professional footer with company information
  - Test output is valid HTML5 without rendering errors
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 4.1, 6.3_

- [x] 8. Implement BaseEmailTemplate plain text rendering method
  - Create implementation of `renderPlainText()` private method
  - Convert HTML structure to plain text with proper line breaks
  - Include company logo reference in ASCII format or text description
  - Maintain content hierarchy using line separators and text formatting
  - Include complete footer with all company information
  - Ensure line length does not exceed 75 characters for mobile readability
  - _Requirements: 6.4, 6.6, 4.6, 6.5_

- [x] 9. Write property tests for BaseEmailTemplate HTML generation
  - **Property 1: Logo Presence in All Emails**
  - **Validates: Requirements 1.1, 1.7, 2.1**
  - Generate 100+ random email variations with different content
  - Verify each HTML output contains img element with src containing "logo"
  - Verify alt text equals "ACE Services" in each logo
  - _Sub-task*_

- [x] 10. Write property tests for BaseEmailTemplate brand color consistency
  - **Property 2: Orange Brand Color Consistency**
  - **Validates: Requirements 1.2, 1.4, 2.3**
  - Generate 100+ emails with different content types
  - Verify CSS contains #FF8C00 in button, link, and border styles
  - Ensure #FF8C00 is only color used for interactive elements
  - _Sub-task*_

- [x] 11. Write property tests for white background and footer presence
  - **Property 3: White Background Applied**
  - **Validates: Requirements 1.3**
  - **Property 4: Footer Contains All Required Information**
  - **Validates: Requirements 1.5, 5.1, 5.2**
  - Verify main container has background-color: #FFFFFF
  - Verify footer contains "ACE Services", phone, email, and address
  - Test 50+ email variations ensure footer always present
  - _Sub-task*_

- [x] 12. Write property tests for dual format generation
  - **Property 5: Dual Format Generation**
  - **Validates: Requirements 6.1, 6.2, 6.3**
  - Generate 100+ email templates
  - Verify each returns object with html and text properties
  - Verify both contain original content
  - _Sub-task*_

- [x] 13. Write property tests for plain text HTML tag validation
  - **Property 6: Plain Text Contains No HTML Markup**
  - **Validates: Requirements 6.4**
  - Generate 100+ templates
  - Verify plain text output matches regex: no `<[^>]+>` patterns
  - Verify all content from HTML version is present in plain text
  - _Sub-task*_

- [x] 14. Write property tests for plain text footer information
  - **Property 7: Plain Text Includes Footer Information**
  - **Validates: Requirements 5.7, 6.6**
  - Generate 100+ templates
  - Verify plain text contains "ACE Services", phone, email, address
  - _Sub-task*_

- [x] 15. Write unit tests for BaseEmailTemplate instantiation
  - Test valid template options create instance without errors
  - Test missing subject throws validation error
  - Test missing mainContent throws validation error
  - Test preheader is optional and preserved when provided
  - Test subject is preserved exactly in output
  - _Sub-task*_

- [x] 16. Checkpoint - Verify BaseEmailTemplate implementation
  - Ensure BaseEmailTemplate class compiles and instantiates correctly
  - Verify render() method returns both html and text properties
  - Verify all unit tests for edge cases pass
  - Verify all property tests pass with 100+ iterations
  - Ask the user if questions arise before proceeding to trigger migration

### Phase 3: Responsive Design and Accessibility Validation

- [x] 17. Implement responsive CSS media query validation
  - Create test to verify CSS contains media queries at 320px, 480px, 600px breakpoints
  - Verify logo dimensions are 200px (mobile) and 300px (desktop)
  - Verify button padding/sizing adjusts for mobile (full-width) and desktop (inline)
  - Verify content padding reduces on mobile (12px), increases on desktop (24px)
  - Test HTML output contains proper viewport meta tag
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_

- [x] 18. Write property tests for responsive CSS coverage
  - **Property 11: Responsive CSS Media Query Coverage**
  - **Validates: Requirements 4.1, 4.2, 4.3**
  - Generate 50+ different email templates
  - Verify each generated CSS contains media query blocks
  - Verify breakpoints cover 320px, 480px, 600px ranges
  - _Sub-task*_

- [x] 19. Write property tests for logo responsive dimensions
  - **Property 12: Logo Responsive Dimensions**
  - **Validates: Requirements 4.5, 4.7**
  - Verify logo max-width: 200px in mobile media query
  - Verify logo max-width: 300px in desktop media query
  - Test 50+ templates
  - _Sub-task*_

- [x] 20. Write property tests for button touch target sizes
  - **Property 14: Button Minimum Touch Target**
  - **Validates: Requirements 4.7, accessibility**
  - Verify button CSS has min-width: 44px and min-height: 44px
  - Test 50+ emails with different button variations
  - _Sub-task*_

- [x] 21. Write unit tests for contrast ratio compliance
  - Test white text on #FF8C00 orange has sufficient contrast (5.3:1)
  - Test dark gray #666 on white has sufficient contrast (7.1:1)
  - Test orange on light background #FFF3E0 has sufficient contrast (4.8:1)
  - _Requirements: 2.4, accessibility_
  - _Sub-task*_

### Phase 4: Integration with Email Triggers (Part 1 - Auth & Project Emails)

- [x] 22. Update all authentication email templates to use BaseEmailTemplate
  - Modify EmailTemplates.accountCreated() to wrap content in BaseEmailTemplate
  - Modify EmailTemplates.loginNotification() to use BaseEmailTemplate
  - Modify EmailTemplates.failedLoginAlert() to use BaseEmailTemplate
  - Modify EmailTemplates.accountLocked() to use BaseEmailTemplate
  - Modify EmailTemplates.accountUnlocked() to use BaseEmailTemplate
  - Modify EmailTemplates.passwordResetRequest() to use BaseEmailTemplate
  - Modify EmailTemplates.passwordChanged() to use BaseEmailTemplate
  - Modify EmailTemplates.accountDeactivated() to use BaseEmailTemplate
  - Modify EmailTemplates.accountReactivated() to use BaseEmailTemplate
  - Return BaseEmailTemplate.render() output (dual html/text format)
  - _Requirements: 2.1, 2.2, 1.1, 1.3, 1.5_

- [x] 23. Update all project email templates to use BaseEmailTemplate
  - Modify EmailTemplates.projectSubmitted() to use BaseEmailTemplate
  - Modify EmailTemplates.projectStatusChanged() to use BaseEmailTemplate
  - Modify EmailTemplates.projectAssigned() with BaseEmailTemplate wrapper
  - Modify EmailTemplates.projectApproved() to use BaseEmailTemplate
  - Modify EmailTemplates.projectRejected() to use BaseEmailTemplate
  - Modify EmailTemplates.projectCompleted() to use BaseEmailTemplate
  - Return BaseEmailTemplate.render() output for all templates
  - _Requirements: 2.1, 2.2, 1.1, 1.3, 1.5_

- [x] 24. Fix file count bug in project assignment emails
  - Update triggerProjectAssigned() to accept project object with files
  - Call countEmailFiles(params.project) to get accurate file count
  - Pass fileCount, fileText, and fileList to EmailTemplates.projectAssigned()
  - Update EmailTemplates.projectAssigned() to display file information
  - Ensure file count reflects actual files at time of email generation
  - Test with 0 files, 1 file, 5+ files scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 25. Write property tests for file count in project assignment
  - **Property 10: File Count Updates on State Change**
  - **Validates: Requirements 3.6**
  - Test project assignment emails generated at different times
  - Verify file counts change when project files are added/removed
  - Test 50+ project state transitions
  - _Sub-task*_

- [x] 26. Update all RFI email templates to use BaseEmailTemplate
  - Modify EmailTemplates.rfiCreated() to use BaseEmailTemplate
  - Modify EmailTemplates.rfiAnswered() to use BaseEmailTemplate
  - Modify EmailTemplates.rfiOverdue() to use BaseEmailTemplate
  - Modify EmailTemplates.rfiForwarded() to use BaseEmailTemplate
  - Return BaseEmailTemplate.render() output for all templates
  - _Requirements: 2.1, 2.2, 1.1, 1.3, 1.5_

### Phase 5: Integration with Email Triggers (Part 2 - Delivery, Files, Summaries)

- [x] 27. Update file upload email template to use BaseEmailTemplate
  - Modify EmailTemplates.fileUploaded() to use BaseEmailTemplate
  - Return BaseEmailTemplate.render() output
  - _Requirements: 2.1, 2.2, 1.1, 1.3, 1.5_

- [x] 28. Fix file count bug in client delivery emails
  - Update triggerClientDelivery() to accept delivery object with files
  - Call countEmailFiles(params.delivery) to get accurate file count
  - Pass fileCount, fileText, and fileList to EmailTemplates.clientDeliveryEmail()
  - Update EmailTemplates.clientDeliveryEmail() to display file information
  - Ensure file count reflects actual delivery files at time of email generation
  - Test with 0 files, 1 file, 10+ files scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 29. Update delivery email template to use BaseEmailTemplate
  - Wrap EmailTemplates.clientDeliveryEmail() with BaseEmailTemplate
  - Return BaseEmailTemplate.render() output
  - _Requirements: 2.1, 2.2, 1.1, 1.3, 1.5_

- [x] 30. Update all summary email templates to use BaseEmailTemplate
  - Modify EmailTemplates.dailySummary() to use BaseEmailTemplate
  - Modify EmailTemplates.weeklySummary() to use BaseEmailTemplate
  - Return BaseEmailTemplate.render() output for all templates
  - _Requirements: 2.1, 2.2, 1.1, 1.3, 1.5_

- [x] 31. Write integration tests for all 54 email triggers
  - Call triggerAccountCreated with valid params, verify email structure
  - Call triggerLoginNotification, verify template applied
  - Call triggerPasswordResetRequest, verify template applied
  - Call triggerAccountLocked, verify template applied
  - Call triggerAccountUnlocked, verify template applied
  - Call triggerPasswordChanged, verify template applied
  - Call triggerAccountDeactivated, verify template applied
  - Call triggerAccountReactivated, verify template applied
  - Call triggerProjectSubmitted, verify template applied
  - Call triggerProjectStatusChanged, verify template applied
  - Call triggerProjectAssigned with project object, verify file count included
  - Call triggerProjectApproved, verify template applied
  - Call triggerProjectRejected, verify template applied
  - Call triggerProjectCompleted, verify template applied
  - Call triggerRFICreated, verify template applied
  - Call triggerRFIAnswered, verify template applied
  - Call triggerRFIOverdue, verify template applied
  - Call triggerRFIForwarded, verify template applied
  - Call triggerFileUploaded, verify template applied
  - Call triggerClientDelivery with delivery object, verify file count included
  - Call triggerDailySummary, verify template applied
  - Call triggerWeeklySummary, verify template applied
  - Verify all return objects have html and text properties
  - _Requirements: 2.1, 2.2, 6.1, 6.2_
  - _Sub-task*_

- [x] 32. Checkpoint - Verify all triggers use BaseEmailTemplate
  - Ensure all 54 email triggers have been updated
  - Verify each trigger returns both HTML and plain text versions
  - Verify integration tests pass for all triggers
  - Ask the user if questions arise before proceeding to formatting validation

### Phase 6: Plain Text Formatting and Footer Validation

- [x] 33. Write property tests for plain text URL formatting
  - **Property 19: Plain Text URL Formatting**
  - **Validates: Requirements 6.8**
  - Generate 50+ emails containing URLs
  - Verify plain text includes full URLs (https://...)
  - Verify plain text doesn't use styled link text
  - _Sub-task*_

- [x] 34. Write property tests for footer font size differentiation
  - **Property 15: Footer Font Size Smaller Than Body**
  - **Validates: Requirements 5.5**
  - Generate 100+ emails
  - Verify footer font-size CSS is smaller than body (12-13px vs 16px)
  - _Sub-task*_

- [x] 35. Write property tests for contrast ratio compliance
  - **Property 20: Contrast Ratio Compliance**
  - **Validates: Requirements 2.4, accessibility**
  - Test color combinations in generated emails
  - Verify all text/background combinations meet 4.5:1 WCAG AA standard
  - _Sub-task*_

- [x] 36. Write property tests for footer information consistency
  - Generate 100+ different email types with BaseEmailTemplate
  - Verify every email footer contains company name "ACE Services"
  - Verify every email footer contains valid phone number
  - Verify every email footer contains valid email address
  - Verify every email footer contains complete mailing address
  - _Sub-task*_

- [x] 37. Write property tests for subject line preservation
  - **Property 16: Subject Line Preserved**
  - Generate 100+ templates with different subjects
  - Verify returned subject matches input subject exactly
  - _Sub-task*_

### Phase 7: End-to-End Responsive Design and Format Validation

- [x] 38. Test responsive HTML rendering across breakpoints
  - Test email HTML at 320px viewport (mobile)
  - Test email HTML at 480px viewport (mobile landscape)
  - Test email HTML at 600px viewport (tablet)
  - Test email HTML at 1200px viewport (desktop)
  - Verify no horizontal scrolling at any breakpoint
  - Verify logo dimensions adjust correctly
  - Verify buttons are full-width on mobile, inline on desktop
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_
  - _Sub-task*_

- [x] 39. Test plain text email formatting and readability
  - Verify plain text line length does not exceed 75 characters
  - Verify plain text maintains proper structure without HTML tags
  - Verify plain text includes all content from HTML version
  - Verify plain text footer is properly formatted with line breaks
  - Test at minimum 100 character display width (mobile)
  - _Requirements: 4.6, 6.4, 6.5, 6.6_
  - _Sub-task*_

- [x] 40. Test multipart MIME email structure
  - **Property 18: Multipart MIME Structure**
  - **Validates: Requirements 6.1, 6.2**
  - Verify EmailService receives both html and text in EmailOptions
  - Verify Resend API creates multipart/alternative MIME messages
  - Test 20+ different email types through full pipeline
  - _Sub-task*_

- [x] 41. Test backward compatibility of trigger signatures
  - Verify existing trigger method signatures unchanged
  - Call all triggers with original parameter sets (no new required params)
  - Verify optional file count parameters are truly optional
  - Verify old code calling triggers still works
  - _Requirements: Backward Compatibility_
  - _Sub-task*_

- [x] 42. Write property tests for trigger template consistency
  - **Property 17: All Trigger Types Include Template**
  - **Validates: Requirements 2.1, 2.2**
  - Generate 100+ random trigger executions across all 54 types
  - Verify each returns templates with footer section
  - Verify each includes brand logo styling
  - _Sub-task*_

### Phase 8: Comprehensive Testing and Validation

- [x] 43. Run all unit tests for template system
  - Execute file count utility unit tests
  - Execute BaseEmailTemplate instantiation tests
  - Execute contrast ratio compliance tests
  - Verify all tests pass without errors
  - _Sub-task*_

- [x] 44. Run all property-based tests for template properties
  - Execute Property 1: Logo Presence (100+ iterations)
  - Execute Property 2: Brand Color Consistency (100+ iterations)
  - Execute Property 3: White Background (50+ iterations)
  - Execute Property 4: Footer Information (50+ iterations)
  - Execute Property 5: Dual Format Generation (100+ iterations)
  - Execute Property 6: Plain Text No HTML (100+ iterations)
  - Execute Property 7: Plain Text Footer Info (100+ iterations)
  - Execute Property 8: File Count Accuracy (100+ iterations)
  - Execute Property 9: File Count Zero Handling (50+ iterations)
  - Execute Property 10: File Count State Changes (50+ iterations)
  - Execute Property 11: Responsive CSS Coverage (50+ iterations)
  - Execute Property 12: Logo Responsive Dimensions (50+ iterations)
  - Execute Property 13: Plain Text Line Length (50+ iterations)
  - Execute Property 14: Button Touch Target (50+ iterations)
  - Execute Property 15: Footer Font Size (100+ iterations)
  - Execute Property 16: Subject Line Preservation (100+ iterations)
  - Execute Property 17: Trigger Template Consistency (100+ iterations)
  - Execute Property 18: Multipart MIME Structure (20+ iterations)
  - Execute Property 19: Plain Text URLs (50+ iterations)
  - Execute Property 20: Contrast Ratios (50+ iterations)
  - Verify all properties pass their iterations
  - _Sub-task*_

- [x] 45. Run integration tests for all email triggers
  - Execute tests for all 54 email triggers
  - Verify each trigger produces valid HTML and plain text
  - Verify file count accuracy for project and delivery emails
  - Test backward compatibility with original signatures
  - _Sub-task*_

- [x] 46. Checkpoint - Verify all tests pass
  - Ensure unit tests: 100% passing
  - Ensure property tests: all 20 properties passing
  - Ensure integration tests: all 54 triggers verified
  - Verify no regressions in existing email trigger behavior
  - Ask the user if questions arise before cleanup and finalization

### Phase 9: Documentation and Final Verification

- [x] 47. Create inline code documentation
  - Add JSDoc comments to BaseEmailTemplate class methods
  - Add JSDoc comments to countEmailFiles function
  - Add JSDoc comments to ResponsiveEmailCSS class
  - Document parameter types and return types
  - Document edge cases and error conditions
  - _Requirements: Code quality_

- [x] 48. Verify production deployment readiness
  - Check that no new environment variables required (uses existing config)
  - Verify BaseEmailTemplate only uses Node.js built-ins (no new dependencies)
  - Verify HTML email size < 100KB for typical emails
  - Verify CSS is minified and optimized
  - Verify all 54 trigger methods work without changes to existing code
  - _Requirements: Deployment considerations_

- [x] 49. Create test fixtures and example emails
  - Generate sample HTML email output for documentation
  - Generate sample plain text email output for documentation
  - Create example showing file count display with 0, 1, and 5+ files
  - Create responsive design visualization (mobile/tablet/desktop)
  - _Requirements: Code quality_

- [x] 50. Final checkpoint - System ready for production
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ensure all integration tests pass
  - Verify backward compatibility maintained
  - Confirm all 54 email triggers updated and working
  - Ask the user if any issues arise before marking complete

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery. These include most testing tasks.
- Each task references specific requirements for traceability.
- Property-based tests validate universal correctness properties, while unit tests validate specific examples.
- File count utility is used in project assignment and delivery emails (tasks 24 and 28).
- All template wrapper modifications are presentation-only with no impact on trigger logic.
- Checkpoint tasks provide opportunities to verify progress and ask questions before proceeding.
- The implementation maintains full backward compatibility with existing email trigger signatures.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4", "5", "6"] },
    { "id": 2, "tasks": ["7", "8"] },
    { "id": 3, "tasks": ["9", "10", "11", "12", "13", "14", "15"] },
    { "id": 4, "tasks": ["16", "17", "18", "19", "20", "21"] },
    { "id": 5, "tasks": ["22", "23", "26"] },
    { "id": 6, "tasks": ["24", "25"] },
    { "id": 7, "tasks": ["27", "28", "29", "30"] },
    { "id": 8, "tasks": ["31", "32"] },
    { "id": 9, "tasks": ["33", "34", "35", "36", "37"] },
    { "id": 10, "tasks": ["38", "39", "40", "41", "42"] },
    { "id": 11, "tasks": ["43", "44", "45", "46"] },
    { "id": 12, "tasks": ["47", "48", "49", "50"] }
  ]
}
```

---

## Implementation Notes

### Language Selection

This implementation uses **TypeScript** as the programming language, matching the existing ACE Services Portal tech stack (NestJS API with TypeScript).

### Key Files to Create/Modify

**New Files:**
- `apps/api/src/email/email-template.base.ts` - BaseEmailTemplate class
- `apps/api/src/email/email-template.types.ts` - TypeScript interfaces and types
- `apps/api/src/email/email-template.styles.ts` - ResponsiveEmailCSS class
- `apps/api/src/email/email-template.utilities.ts` - countEmailFiles function
- `apps/api/src/email/email-template.base.spec.ts` - Unit and property tests

**Modified Files:**
- `apps/api/src/email/email.templates.ts` - Update all 54 template methods
- `apps/api/src/email/email.triggers.service.ts` - Update file count parameters in project and delivery triggers
- `apps/api/src/email/email.module.ts` - Export new template classes if needed

### Implementation Strategy

1. **Wave 0-1:** Build foundation (types, CSS, utilities)
2. **Wave 2:** Core BaseEmailTemplate rendering (HTML & plain text)
3. **Wave 3:** Property-based tests validate correctness properties
4. **Wave 4:** Responsive design validation
5. **Wave 5-7:** Integrate with all 54 email triggers
6. **Wave 8:** Integration testing across system
7. **Wave 9-12:** Formatting validation, testing, documentation

### Testing Framework

- **Unit Tests:** Jest (already in use by project)
- **Property Tests:** fast-check library (lightweight property-based testing for TypeScript)
- **Integration Tests:** Use existing email trigger test patterns

### Success Criteria

✓ All 54 email triggers updated with BaseEmailTemplate wrapper  
✓ File count bug fixed in project assignment and delivery emails  
✓ All emails display company logo, footer, and orange branding  
✓ Both HTML and plain text formats generated for all emails  
✓ Responsive design works on 320px, 480px, 600px, and 1200px viewports  
✓ All property-based tests pass (20 properties, 100+ iterations each)  
✓ All unit tests pass  
✓ All integration tests pass  
✓ Backward compatibility maintained with existing trigger signatures  
✓ Zero breaking changes to existing business logic
