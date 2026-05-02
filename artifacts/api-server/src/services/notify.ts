import { db } from "@workspace/db";
import { notifications } from "@workspace/db";
import { sendEmail } from "./email";

type NotificationType =
  | "quote_requested"
  | "quote_received"
  | "booking_confirmed"
  | "payment_received"
  | "payment_released"
  | "review_reminder";

export interface NotifyOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  emailTo?: string;
}

/**
 * Fire-and-forget notification: inserts a DB row + optionally sends email.
 * Never throws — errors are swallowed so the calling route isn't affected.
 */
export function notify(opts: NotifyOptions): void {
  db.insert(notifications)
    .values({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      metadata: opts.metadata ?? null,
    })
    .catch((err) => {
      console.error("[notify] DB insert failed", err);
    });

  if (opts.emailTo) {
    sendEmail({
      to: opts.emailTo,
      subject: opts.title,
      html: `<p style="font-family:sans-serif">${opts.body}</p>
             <p style="font-family:sans-serif;color:#888;font-size:12px">
               Nairobi Events Marketplace — <a href="https://nairobievents.co.ke">nairobievents.co.ke</a>
             </p>`,
      text: opts.body,
    }).catch(() => {});
  }
}
