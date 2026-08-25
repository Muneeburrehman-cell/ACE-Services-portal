import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'demo-console';
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor(private config: ConfigService) {
    this.from = this.config.get<string>('RESEND_FROM_EMAIL') || 'noreply@aceservices.com';

    const resendKey = this.config.get<string>('RESEND_API_KEY');
    if (resendKey && resendKey !== 'demo' && !resendKey.startsWith('your_')) {
      this.resend = new Resend(resendKey);
      this.logger.log('EmailService configured with Resend');
    } else {
      this.logger.warn('EmailService running in DEMO mode (emails logged to console). Set RESEND_API_KEY in apps/api/.env for live delivery.');
    }
  }

  async send(opts: EmailOptions): Promise<EmailSendResult> {
    // Try Resend if configured
    if (this.resend) {
      try {
        const payload: any = {
          from: this.from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
        };
        if (opts.html) payload.html = opts.html;
        if (opts.attachments?.length) {
          payload.attachments = opts.attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            content_type: a.contentType,
          }));
        }
        const res = await this.resend.emails.send(payload);
        if (res.error) {
          this.logger.error(`Resend API error: ${res.error.message} (${res.error.name})`);
          throw new Error(res.error.message);
        }
        this.logger.log(`Email successfully sent via Resend to ${opts.to} (ID: ${res.data?.id})`);
        return { success: true, provider: 'resend', messageId: res.data?.id };
      } catch (err: any) {
        this.logger.error(`Resend email delivery failed: ${err.message}`, err.stack);
        throw new Error(err.message);
      }
    }

    // Demo fallback: Log clearly to console
    console.log('\n================== 📧 EMAIL DISPATCH (DEMO MODE) ==================');
    console.log(`To:          ${opts.to}`);
    console.log(`From:        ${this.from}`);
    console.log(`Subject:     ${opts.subject}`);
    console.log(`Attachments: ${opts.attachments?.length ? opts.attachments.map(a => a.filename).join(', ') : 'None'}`);
    console.log('--- Body ---');
    console.log(opts.text);
    console.log('==================================================================\n');

    return {
      success: true,
      provider: 'demo-console',
      messageId: `demo-${Date.now()}`,
    };
  }
}
