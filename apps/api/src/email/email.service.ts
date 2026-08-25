import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'sendgrid' | 'smtp' | 'demo-console';
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;
  private hasSendgrid = false;
  private from: string;

  constructor(private config: ConfigService) {
    this.from =
      this.config.get<string>('SMTP_FROM') ||
      this.config.get<string>('RESEND_FROM_EMAIL') ||
      this.config.get<string>('SENDGRID_FROM_EMAIL') ||
      'noreply@aceservices.com';

    // 1. Check Resend
    const resendKey = this.config.get<string>('RESEND_API_KEY');
    if (resendKey && resendKey !== 'demo' && !resendKey.startsWith('your_')) {
      this.resend = new Resend(resendKey);
      this.logger.log('EmailService configured with Resend');
    }

    // 2. Check SendGrid
    const sgKey = this.config.get<string>('SENDGRID_API_KEY');
    if (sgKey && sgKey !== 'demo' && !sgKey.startsWith('your_')) {
      sgMail.setApiKey(sgKey);
      this.hasSendgrid = true;
      this.logger.log('EmailService configured with SendGrid');
    }

    // 3. Check SMTP (Gmail, Outlook, AWS SES, or custom SMTP server)
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');
    if (smtpHost && smtpHost !== 'demo') {
      const port = Number(this.config.get<string>('SMTP_PORT') || 587);
      const secure = this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
      });
      this.logger.log(`EmailService configured with SMTP (${smtpHost}:${port})`);
    }

    if (!this.resend && !this.hasSendgrid && !this.smtpTransporter) {
      this.logger.warn('EmailService running in DEMO mode (emails logged to console). Set RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_* in apps/api/.env for live delivery.');
    }
  }

  async send(opts: EmailOptions): Promise<EmailSendResult> {
    // 1. Try Resend if configured
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
        this.logger.log(`Email successfully dispatched via Resend to ${opts.to} (ID: ${res.data?.id})`);
        return { success: true, provider: 'resend', messageId: res.data?.id };
      } catch (err: any) {
        this.logger.error(`Resend email delivery failed: ${err.message}`, err.stack);
        throw new Error(err.message);
      }
    }

    // 2. Try SendGrid if configured
    if (this.hasSendgrid) {
      try {
        const msg: any = {
          to: opts.to,
          from: this.from,
          subject: opts.subject,
          text: opts.text,
          html: opts.html || opts.text.replace(/\n/g, '<br/>'),
        };
        if (opts.attachments?.length) {
          msg.attachments = opts.attachments.map((a) => ({
            content: a.content.toString('base64'),
            filename: a.filename,
            type: a.contentType,
            disposition: 'attachment',
          }));
        }
        const [response] = await sgMail.send(msg);
        this.logger.log(`Email successfully dispatched via SendGrid to ${opts.to} (Status: ${response.statusCode})`);
        return { success: true, provider: 'sendgrid', messageId: response.headers['x-message-id'] as string };
      } catch (err: any) {
        this.logger.error(`SendGrid delivery failed: ${err.message}`, err.stack);
        throw new Error(`SendGrid email failed: ${err.message}`);
      }
    }

    // 3. Try SMTP if configured
    if (this.smtpTransporter) {
      try {
        const info = await this.smtpTransporter.sendMail({
          from: this.from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
          attachments: opts.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        });
        this.logger.log(`Email successfully dispatched via SMTP to ${opts.to} (MessageId: ${info.messageId})`);
        return { success: true, provider: 'smtp', messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`SMTP delivery failed: ${err.message}`, err.stack);
        throw new Error(`SMTP email failed: ${err.message}`);
      }
    }

    // 4. Demo fallback: Log clearly to console
    console.log('\n================== 📧 LIVE EMAIL DISPATCH (DEMO MODE) ==================');
    console.log(`To:          ${opts.to}`);
    console.log(`From:        ${this.from}`);
    console.log(`Subject:     ${opts.subject}`);
    console.log(`Attachments: ${opts.attachments?.length ? opts.attachments.map(a => a.filename).join(', ') : 'None'}`);
    console.log('--- Body ---');
    console.log(opts.text);
    console.log('========================================================================\n');

    return {
      success: true,
      provider: 'demo-console',
      messageId: `demo-${Date.now()}`,
    };
  }
}
