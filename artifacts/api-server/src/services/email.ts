export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log(
      `[email-stub] To: ${opts.to} | Subject: ${opts.subject}\n${opts.text ?? opts.html.replace(/<[^>]+>/g, "")}`,
    );
    return;
  }

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@nairobievents.co.ke",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}
