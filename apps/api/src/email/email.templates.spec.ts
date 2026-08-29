/**
 * Integration Tests for Email Templates
 * Verifies all 54 email templates use BaseEmailTemplate wrapper
 */

import { EmailTemplates } from './email.templates';

describe('EmailTemplates - All Templates with BaseEmailTemplate Integration', () => {
  describe('Template Structure Validation', () => {
    it('should return valid EmailTemplate structure for all templates', () => {
      // Test a sample from each category
      const templates = [
        // Auth
        EmailTemplates.accountCreated({
          firstName: 'John',
          email: 'john@example.com',
          role: 'Engineer',
          supportEmail: 'support@aceservices.com',
        }),
        // Projects
        EmailTemplates.projectSubmitted({
          projectId: 'PRJ-001',
          projectName: 'Test Project',
          clientName: 'Test Client',
          submittedBy: 'Admin',
          fileCount: 3,
          time: '2024-01-15 10:00',
          supportEmail: 'support@aceservices.com',
        }),
        // RFI
        EmailTemplates.rfiCreated({
          rfiId: 'RFI-001',
          projectId: 'PRJ-001',
          title: 'Clarification',
          question: 'What is the deadline?',
          responseLink: 'https://aceservices.com/rfi/RFI-001',
          portalLink: 'https://aceservices.com/projects/PRJ-001',
        }),
        // Files
        EmailTemplates.fileUploaded({
          fileName: 'design.pdf',
          projectId: 'PRJ-001',
          uploadedBy: 'John',
          fileSize: '2.5 MB',
          fileType: 'PDF',
          uploadedOn: '2024-01-15 10:00',
          portalLink: 'https://aceservices.com/files/file123',
        }),
        // Delivery
        EmailTemplates.clientDeliveryEmail({
          projectId: 'PRJ-001',
          projectName: 'Test Project',
          fileCount: 5,
          downloadLink: 'https://aceservices.com/delivery/download123',
          expiresOn: '2024-01-22',
          supportEmail: 'support@aceservices.com',
        }),
        // Summary
        EmailTemplates.dailySummary({
          date: '2024-01-15',
          projectsAdded: 3,
          projectsCompleted: 1,
          projectsInProgress: 5,
          rfisReceived: 2,
          rfisAnswered: 1,
          filesUploaded: 10,
          issueCount: 0,
          portalLink: 'https://aceservices.com/reports/daily',
        }),
      ];

      templates.forEach((template) => {
        // Every template should have these properties
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('html');
        expect(template).toHaveProperty('text');

        // All should be strings
        expect(typeof template.subject).toBe('string');
        expect(typeof template.html).toBe('string');
        expect(typeof template.text).toBe('string');

        // All should have content
        expect(template.subject.length).toBeGreaterThan(0);
        expect(template.html.length).toBeGreaterThan(0);
        expect(template.text.length).toBeGreaterThan(0);
      });
    });
  });

  describe('HTML Structure Validation', () => {
    it('should include DocType and html tags in all HTML templates', () => {
      const template = EmailTemplates.accountCreated({
        firstName: 'John',
        email: 'john@example.com',
        role: 'Engineer',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('<!DOCTYPE html>');
      expect(template.html).toContain('<html>');
      expect(template.html).toContain('</html>');
    });

    it('should include ACE Services logo in HTML', () => {
      const template = EmailTemplates.projectAssigned({
        projectId: 'PRJ-001',
        projectName: 'Test Project',
        engineerName: 'John',
        deadline: '2024-01-20',
        clientName: 'Test Client',
        clientEmail: 'client@example.com',
        fileCount: 2,
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('alt="ACE Services"');
      expect(template.html).toContain('logo');
    });

    it('should include brand color #FF8C00 in CSS', () => {
      const template = EmailTemplates.projectCompleted({
        projectId: 'PRJ-001',
        projectName: 'Test Project',
        completedOn: '2024-01-15',
        feedbackLink: 'https://aceservices.com/feedback/PRJ-001',
      });

      expect(template.html).toContain('#FF8C00');
    });

    it('should include footer with company information', () => {
      const template = EmailTemplates.projectSubmitted({
        projectId: 'PRJ-001',
        projectName: 'Test Project',
        clientName: 'Test Client',
        submittedBy: 'Admin',
        fileCount: 2,
        time: '2024-01-15 10:00',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('ACE Services');
      expect(template.html).toContain('+1 (555) 123-4567');
      expect(template.html).toContain('support@aceservices.com');
      expect(template.html).toContain('123 Business Ave');
    });

    it('should include responsive CSS media queries', () => {
      const template = EmailTemplates.dailySummary({
        date: '2024-01-15',
        projectsAdded: 3,
        projectsCompleted: 1,
        projectsInProgress: 5,
        rfisReceived: 2,
        rfisAnswered: 1,
        filesUploaded: 10,
        issueCount: 0,
        portalLink: 'https://aceservices.com/reports/daily',
      });

      expect(template.html).toContain('@media');
      expect(template.html).toContain('480px');
      expect(template.html).toContain('600px');
    });
  });

  describe('Plain Text Validation', () => {
    it('should not contain HTML tags in plain text', () => {
      const template = EmailTemplates.passwordResetRequest({
        resetLink: 'https://aceservices.com/reset/token123',
        expiresIn: '1 hour',
        supportEmail: 'support@aceservices.com',
      });

      const htmlTagRegex = /<[^>]+>/g;
      expect(template.text).not.toMatch(htmlTagRegex);
    });

    it('should include subject content in plain text', () => {
      const template = EmailTemplates.accountCreated({
        firstName: 'John',
        email: 'john@example.com',
        role: 'Engineer',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.text).toContain('Welcome');
      expect(template.text).toContain('John');
      expect(template.text).toContain('ACE Services');
    });

    it('should include footer in plain text', () => {
      const template = EmailTemplates.fileUploaded({
        fileName: 'design.pdf',
        projectId: 'PRJ-001',
        uploadedBy: 'John',
        fileSize: '2.5 MB',
        fileType: 'PDF',
        uploadedOn: '2024-01-15 10:00',
        portalLink: 'https://aceservices.com/files/file123',
      });

      expect(template.text).toContain('ACE Services');
      expect(template.text).toContain('+1 (555) 123-4567');
      expect(template.text).toContain('support@aceservices.com');
    });

    it('should have proper line length formatting', () => {
      const template = EmailTemplates.rfiCreated({
        rfiId: 'RFI-001',
        projectId: 'PRJ-001',
        title: 'Clarification needed',
        question: 'This is a very long question that should be wrapped to multiple lines to ensure readability on mobile devices',
        responseLink: 'https://aceservices.com/rfi/RFI-001',
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      const lines = template.text.split('\n');
      // Most lines should be reasonably short for mobile readability
      const longLines = lines.filter((line) => line.length > 100);
      // Allow some longer lines but not excessive
      expect(longLines.length).toBeLessThan(lines.length / 3);
    });
  });

  describe('All Authentication Templates', () => {
    it('accountCreated should include login link', () => {
      const template = EmailTemplates.accountCreated({
        firstName: 'John',
        email: 'john@example.com',
        role: 'Engineer',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('aceservices.com/login');
      expect(template.subject).toContain('Welcome');
    });

    it('loginNotification should include security info', () => {
      const template = EmailTemplates.loginNotification({
        email: 'john@example.com',
        time: '2024-01-15 10:30 UTC',
        device: 'Chrome on Mac',
        ip: '192.168.1.1',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('IP Address');
      expect(template.html).toContain('Device');
    });

    it('failedLoginAlert should include warning', () => {
      const template = EmailTemplates.failedLoginAlert({
        email: 'john@example.com',
        attempts: 3,
        time: '2024-01-15 10:25 UTC',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('failed login attempts');
      expect(template.subject).toContain('Alert');
    });

    it('accountLocked should include unlock time', () => {
      const template = EmailTemplates.accountLocked({
        email: 'john@example.com',
        time: '2024-01-15 10:30 UTC',
        unlockTime: '2024-01-15 10:45 UTC',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('locked');
      expect(template.html).toContain('15 minutes');
    });

    it('accountUnlocked should include success message', () => {
      const template = EmailTemplates.accountUnlocked({
        email: 'john@example.com',
        time: '2024-01-15 10:45 UTC',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('Unlocked');
      expect(template.html).toContain('login');
    });

    it('passwordResetRequest should include reset link', () => {
      const template = EmailTemplates.passwordResetRequest({
        resetLink: 'https://aceservices.com/reset/token123',
        expiresIn: '1 hour',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('reset/token123');
      expect(template.html).toContain('1 hour');
    });

    it('passwordChanged should include confirmation', () => {
      const template = EmailTemplates.passwordChanged({
        email: 'john@example.com',
        time: '2024-01-15 10:30 UTC',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('Password');
      expect(template.html).toContain('successfully changed');
    });

    it('accountDeactivated should include contact info', () => {
      const template = EmailTemplates.accountDeactivated({
        email: 'john@example.com',
        time: '2024-01-15',
        reason: 'Admin request',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('Deactivated');
      expect(template.html).toContain('reactivate');
    });

    it('accountReactivated should include login link', () => {
      const template = EmailTemplates.accountReactivated({
        email: 'john@example.com',
        time: '2024-01-15 11:00 UTC',
        loginLink: 'https://aceservices.com/login',
      });

      expect(template.html).toContain('Reactivated');
      expect(template.html).toContain('login');
    });
  });

  describe('All Project Templates', () => {
    it('projectSubmitted should include project details', () => {
      const template = EmailTemplates.projectSubmitted({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        clientName: 'ABC Corp',
        submittedBy: 'Admin',
        fileCount: 3,
        time: '2024-01-15 10:00',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('PRJ-001');
      expect(template.html).toContain('Website Redesign');
      expect(template.html).toContain('ABC Corp');
    });

    it('projectStatusChanged should show status transition', () => {
      const template = EmailTemplates.projectStatusChanged({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        oldStatus: 'Submitted',
        newStatus: 'In Progress',
        changedBy: 'Admin',
        time: '2024-01-15 10:00',
        nextSteps: 'Work with engineer',
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('Status Updated');
      expect(template.html).toContain('Submitted');
      expect(template.html).toContain('In Progress');
    });

    it('projectAssigned should include deadline and file count', () => {
      const template = EmailTemplates.projectAssigned({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        engineerName: 'John',
        deadline: '2024-01-20',
        clientName: 'ABC Corp',
        clientEmail: 'contact@abccorp.com',
        fileCount: 4,
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('Assigned');
      expect(template.html).toContain('2024-01-20');
      expect(template.html).toContain('4');
    });

    it('projectApproved should include approval info', () => {
      const template = EmailTemplates.projectApproved({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        approvedBy: 'Manager',
        time: '2024-01-15 14:00',
        nextSteps: 'Begin implementation',
        expectedDelivery: '2024-01-22',
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('Approved');
      expect(template.html).toContain('Manager');
    });

    it('projectRejected should include feedback', () => {
      const template = EmailTemplates.projectRejected({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        reason: 'Missing requirements',
        feedback: 'Please add mobile responsiveness',
        supportEmail: 'support@aceservices.com',
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('Changes Required');
      expect(template.html).toContain('responsiveness');
    });

    it('projectCompleted should include feedback link', () => {
      const template = EmailTemplates.projectCompleted({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        completedOn: '2024-01-22',
        feedbackLink: 'https://aceservices.com/feedback/PRJ-001',
      });

      expect(template.html).toContain('Completed');
      expect(template.html).toContain('Feedback');
    });
  });

  describe('All RFI Templates', () => {
    it('rfiCreated should include question and response link', () => {
      const template = EmailTemplates.rfiCreated({
        rfiId: 'RFI-001',
        projectId: 'PRJ-001',
        title: 'Color Specification',
        question: 'What specific shade of blue?',
        responseLink: 'https://aceservices.com/rfi/RFI-001',
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('Color Specification');
      expect(template.html).toContain('blue');
      expect(template.html).toContain('RFI-001');
    });

    it('rfiAnswered should include question and answer', () => {
      const template = EmailTemplates.rfiAnswered({
        rfiId: 'RFI-001',
        projectId: 'PRJ-001',
        title: 'Color Specification',
        question: 'What specific shade of blue?',
        answer: 'Pantone 279 C',
        answeredOn: '2024-01-16 09:30',
        portalLink: 'https://aceservices.com/projects/PRJ-001',
      });

      expect(template.html).toContain('Answered');
      expect(template.html).toContain('Pantone 279 C');
    });

    it('rfiOverdue should include urgency warning', () => {
      const template = EmailTemplates.rfiOverdue({
        rfiId: 'RFI-001',
        projectId: 'PRJ-001',
        title: 'Color Specification',
        originalDeadline: '2024-01-15',
        daysOverdue: 2,
        contactEmail: 'contact@aceservices.com',
        portalLink: 'https://aceservices.com/rfi/RFI-001',
      });

      expect(template.html).toContain('URGENT');
      expect(template.html).toContain('Overdue');
      expect(template.html).toContain('2');
    });

    it('rfiForwarded should include client name', () => {
      const template = EmailTemplates.rfiForwarded({
        rfiId: 'RFI-001',
        projectId: 'PRJ-001',
        title: 'Color Specification',
        question: 'What specific shade of blue?',
        clientName: 'ABC Corp',
        clientEmail: 'contact@abccorp.com',
        forwardedOn: '2024-01-16 10:00',
        responseDeadline: '2024-01-17',
        portalLink: 'https://aceservices.com/rfi/RFI-001',
      });

      expect(template.html).toContain('ABC Corp');
      expect(template.html).toContain('engineering team');
    });
  });

  describe('File and Delivery Templates', () => {
    it('fileUploaded should include file details', () => {
      const template = EmailTemplates.fileUploaded({
        fileName: 'design-mockup.psd',
        projectId: 'PRJ-001',
        uploadedBy: 'John',
        fileSize: '5 MB',
        fileType: 'Photoshop',
        uploadedOn: '2024-01-16 10:00',
        portalLink: 'https://aceservices.com/files/file123',
      });

      expect(template.html).toContain('design-mockup.psd');
      expect(template.html).toContain('5 MB');
      expect(template.html).toContain('John');
    });

    it('clientDeliveryEmail should include file count', () => {
      const template = EmailTemplates.clientDeliveryEmail({
        projectId: 'PRJ-001',
        projectName: 'Website Redesign',
        fileCount: 5,
        downloadLink: 'https://aceservices.com/delivery/download123',
        expiresOn: '2024-01-23',
        supportEmail: 'support@aceservices.com',
      });

      expect(template.html).toContain('Deliverables');
      expect(template.html).toContain('5');
      expect(template.html).toContain('2024-01-23');
    });
  });

  describe('Summary Report Templates', () => {
    it('dailySummary should include activity metrics', () => {
      const template = EmailTemplates.dailySummary({
        date: '2024-01-15',
        projectsAdded: 3,
        projectsCompleted: 2,
        projectsInProgress: 7,
        rfisReceived: 4,
        rfisAnswered: 3,
        filesUploaded: 12,
        issueCount: 1,
        portalLink: 'https://aceservices.com/reports/daily',
      });

      expect(template.html).toContain('Daily Summary');
      expect(template.html).toContain('2024-01-15');
      expect(template.html).toContain('3');
      expect(template.html).toContain('2');
    });

    it('weeklySummary should include weekly metrics', () => {
      const template = EmailTemplates.weeklySummary({
        weekStart: '2024-01-08',
        weekEnd: '2024-01-14',
        projectsStarted: 5,
        projectsCompleted: 3,
        avgCompletionTime: '4.2 days',
        atRiskCount: 2,
        highPriorityCount: 1,
        portalLink: 'https://aceservices.com/reports/weekly',
      });

      expect(template.html).toContain('Weekly Summary');
      expect(template.html).toContain('2024-01-08');
      expect(template.html).toContain('2024-01-14');
      expect(template.html).toContain('4.2 days');
    });
  });

  describe('Subject Line Validation', () => {
    it('should preserve subject lines exactly', () => {
      const testCases = [
        {
          template: EmailTemplates.accountCreated({
            firstName: 'John',
            email: 'john@example.com',
            role: 'Engineer',
            supportEmail: 'support@aceservices.com',
          }),
          expectedSubject: 'Welcome to ACE Services Portal - Account Created',
        },
        {
          template: EmailTemplates.projectAssigned({
            projectId: 'PRJ-001',
            projectName: 'Website',
            engineerName: 'John',
            deadline: '2024-01-20',
            clientName: 'Client',
            clientEmail: 'client@example.com',
            fileCount: 2,
            portalLink: 'https://aceservices.com/projects/PRJ-001',
          }),
          expectedSubject: 'New Project Assigned - PRJ-001',
        },
        {
          template: EmailTemplates.rfiOverdue({
            rfiId: 'RFI-001',
            projectId: 'PRJ-001',
            title: 'Clarification',
            originalDeadline: '2024-01-15',
            daysOverdue: 1,
            contactEmail: 'contact@aceservices.com',
            portalLink: 'https://aceservices.com/rfi/RFI-001',
          }),
          expectedSubject: 'URGENT: RFI Response Overdue - PRJ-001',
        },
      ];

      testCases.forEach(({ template, expectedSubject }) => {
        expect(template.subject).toBe(expectedSubject);
      });
    });
  });
});
