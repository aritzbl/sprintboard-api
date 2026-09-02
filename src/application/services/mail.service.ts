import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { EnvVar } from '@config/env-var';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly linkExpirationHours: number;

  constructor(config: ConfigService) {
    const host = config.get<string>(EnvVar.SMTP_HOST);
    const user = config.get<string>(EnvVar.SMTP_USER);
    const password = config.get<string>(EnvVar.SMTP_PASSWORD);
    this.from = config.get<string>(EnvVar.MAIL_FROM) ?? 'Kanbio';
    this.linkExpirationHours = config.getOrThrow<number>(
      EnvVar.LINK_EXPIRATION_HOURS,
    );
    this.transporter = host && user && password
      ? nodemailer.createTransport({
          host,
          port: config.get<number>(EnvVar.SMTP_PORT) ?? 465,
          secure: config.get<boolean>(EnvVar.SMTP_SECURE) ?? true,
          // Render's network has no IPv6 egress; Gmail otherwise resolves to IPv6 first.
          family: 4,
          auth: { user, pass: password },
        })
      : null;
  }

  async send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    if (!this.transporter) {
      throw new ServiceUnavailableException('El envío de correos no está configurado.');
    }
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html,
    });
  }

  async sendInvitation(input: {
    to: string;
    url: string;
    role: string;
    projectNames: string[];
  }): Promise<void> {
    const projects = input.projectNames.length
      ? `Vas a poder colaborar en ${this.escape(input.projectNames.join(', '))}.`
      : 'Vas a poder colaborar con el equipo.';
    await this.send(
      input.to,
      'Te invitaron a Kanbio',
      `Te invitaron a colaborar en Kanbio como ${input.role}. ${projects.replace(/<[^>]*>/g, '')}\n\nAceptar invitación: ${input.url}\n\n${this.expirationNote()} Solo puede usarse una vez.`,
      this.template({
        eyebrow: 'INVITACIÓN',
        title: 'Tu lugar en Kanbio está listo',
        body: `<p>Te invitaron a colaborar como <strong>${this.escape(input.role)}</strong>.</p><p>${projects}</p>`,
        buttonLabel: 'Aceptar invitación',
        buttonUrl: input.url,
        footnote: `${this.expirationNote()} Solo puede usarse una vez.`,
      }),
    );
  }

  sendInvitationInBackground(input: {
    to: string;
    url: string;
    role: string;
    projectNames: string[];
  }): void {
    void this.sendInvitation(input).catch((error: unknown) => {
      this.logger.error(
        'Could not send invitation email.',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  async sendPasswordReset(to: string, url: string): Promise<void> {
    await this.send(
      to,
      'Restablecé tu contraseña de Kanbio',
      `Recibimos una solicitud para cambiar tu contraseña de Kanbio.\n\nRestablecer contraseña: ${url}\n\nSi no fuiste vos, podés ignorar este correo.`,
      this.template({
        eyebrow: 'SEGURIDAD',
        title: 'Restablecé tu contraseña',
        body: '<p>Recibimos una solicitud para cambiar tu contraseña.</p><p>Usá el botón para elegir una nueva contraseña de forma segura.</p>',
        buttonLabel: 'Restablecer contraseña',
        buttonUrl: url,
        footnote: 'Si no fuiste vos, podés ignorar este correo.',
      }),
    );
  }

  sendPasswordResetInBackground(to: string, url: string): void {
    void this.sendPasswordReset(to, url).catch((error: unknown) => {
      this.logger.error(
        'Could not send password reset email.',
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  async sendEmailChange(
    to: string,
    url: string,
  ): Promise<void> {
    await this.send(
      to,
      'Confirmá tu nuevo email de Kanbio',
      `Pediste cambiar el email de tu cuenta de Kanbio.\n\nConfirmar nuevo email: ${url}\n\n${this.expirationNote()} Solo puede usarse una vez.`,
      this.template({
        eyebrow: 'CONFIRMACIÓN',
        title: 'Confirmá tu nuevo email',
        body: '<p>Pediste cambiar el email de tu cuenta de Kanbio.</p><p>Confirmalo para completar el cambio. Luego vas a ingresar con esta nueva dirección.</p>',
        buttonLabel: 'Confirmar nuevo email',
        buttonUrl: url,
        footnote: `${this.expirationNote()} Solo puede usarse una vez.`,
      }),
    );
  }

  private template(input: {
    eyebrow: string;
    title: string;
    body: string;
    buttonLabel: string;
    buttonUrl: string;
    footnote: string;
  }): string {
    return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f6f7f9;color:#202124;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden">
      <tr><td style="padding:28px 32px 20px;background:#fff7f5">
        <span style="display:inline-block;width:32px;height:32px;border-radius:9px;background:#f14a35;color:#ffffff;font-weight:700;font-size:20px;line-height:32px;text-align:center">K</span>
        <span style="margin-left:9px;vertical-align:7px;color:#202124;font-size:18px;font-weight:700">Kanbio</span>
      </td></tr>
      <tr><td style="padding:28px 32px 32px">
        <p style="margin:0 0 10px;color:#f14a35;font-size:11px;font-weight:700;letter-spacing:1.2px">${this.escape(input.eyebrow)}</p>
        <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25;color:#202124">${this.escape(input.title)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#5f6368">${input.body}</div>
        <p style="margin:26px 0"><a href="${this.escape(input.buttonUrl)}" style="display:inline-block;border-radius:9px;background:#f14a35;color:#ffffff;padding:12px 18px;font-size:14px;font-weight:700;text-decoration:none">${this.escape(input.buttonLabel)}</a></p>
        <p style="margin:0;padding-top:18px;border-top:1px solid #eceef0;color:#8a8f98;font-size:12px;line-height:1.5">${this.escape(input.footnote)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  }

  private escape(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      };
      return entities[character];
    });
  }

  private expirationNote(): string {
    const hours = this.linkExpirationHours;
    return hours === 1
      ? 'Este enlace vence en 1 hora.'
      : `Este enlace vence en ${hours} horas.`;
  }
}
