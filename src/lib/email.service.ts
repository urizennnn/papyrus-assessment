import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { readFileSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';

@Injectable()
export class EmailService {
  private key: string;
  private readonly fromEmail: string;

  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly cfg: ConfigService) {
    this.fromEmail = this.cfg.get<string>('EMAIL_FROM');
    this.key = this.cfg.get<string>('SENDGRID_API_KEY');
    if (this.key) {
      sgMail.setApiKey(this.key);
    }
  }

  async sendInviteEmail(to: string, groupName: string, code: string) {
    if (!this.key) {
      this.logger.warn('SENDGRID_API_KEY not configured');
      return;
    }
    const templatePath = join(cwd(), 'src', 'templates', 'invite-email.html');
    const html = readFileSync(templatePath, 'utf-8')
      .replace('{{GROUP_NAME}}', groupName)
      .replace('{{INVITE_CODE}}', code);

    const msg = {
      to,
      from: this.fromEmail,
      subject: `Invitation to join ${groupName}`,
      html,
    };
    try {
      await sgMail.send(msg as any);
      this.logger.log(`Invite email sent to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send invite email', error);
    }
  }
}
