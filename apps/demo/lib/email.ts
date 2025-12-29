import { Resend } from "resend";

import { env } from "./env";

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = "assistant-ui <assistant-ui@mail.vifu.org>";

export async function sendResetPasswordEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #111;">Reset your password</h1>
        <p style="font-size: 16px; color: #444; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to reset your password. This link will expire in 1 hour.
        </p>
        <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Reset Password
        </a>
        <p style="font-size: 14px; color: #666; margin-top: 32px; line-height: 1.6;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">
          assistant-ui
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your email address",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #111;">Verify your email</h1>
        <p style="font-size: 16px; color: #444; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to verify your email address.
        </p>
        <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Verify Email
        </a>
        <p style="font-size: 14px; color: #666; margin-top: 32px; line-height: 1.6;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999;">
          assistant-ui
        </p>
      </div>
    `,
  });
}
