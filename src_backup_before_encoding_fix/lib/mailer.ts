// src/lib/mailer.ts
// Ø£Ø¯Ø§Ø© Ù…ÙˆØ­Ø¯Ø© Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ (ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ØŒ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø·Ù„Ø¨Ø§ØªØŒ Ø¥Ù„Ø®)
// Ù†Ø³ØªØ®Ø¯Ù… Nodemailer Ù…Ø¹ Ø£ÙŠ Ø®Ø¯Ù…Ø© SMTP (GmailØŒ Ø£Ùˆ Ø®Ø¯Ù…Ø§Øª Ù…Ø®ØµØµØ© Ù…Ø«Ù„ Brevo/SendGrid Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠØ©)
//
// Ù…Ù„Ø§Ø­Ø¸Ø© Ù…Ù‡Ù…Ø©: Ø¥Ø°Ø§ Ù„Ù… ØªÙØ¹Ø¨ÙŽÙ‘Ø£ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª SMTP ÙÙŠ .env.localØŒ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù„Ø§ ÙŠØªØ¹Ø·Ù„ Ø£Ø¨Ø¯Ø§Ù‹ -
// ÙÙ‚Ø· Ù„Ø§ ÙŠÙØ±Ø³ÙŽÙ„ Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙØ¹Ù„ÙŠØ§Ù‹ØŒ ÙˆÙŠÙØ·Ø¨Ø¹ ØªÙ†Ø¨ÙŠÙ‡ ÙÙŠ Ø§Ù„Ù€ Terminal Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† Ø±Ù…ÙŠ Ø®Ø·Ø£ ÙŠÙˆÙ‚Ù Ø§Ù„ØªØ³Ø¬ÙŠÙ„

import nodemailer from "nodemailer";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // SMTP ØºÙŠØ± Ù…ÙØ¹Ø¯Ù‘ Ø¨Ø¹Ø¯ - Ù†ØªØ¹Ø§Ù…Ù„ Ù…Ø¹ Ù‡Ø°Ø§ Ø¨Ù„Ø·Ù ÙÙŠ sendEmail Ø£Ø¯Ù†Ø§Ù‡
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // Ø§Ù„Ù…Ù†ÙØ° 465 ÙŠØ³ØªØ®Ø¯Ù… SSL Ù…Ø¨Ø§Ø´Ø±Ø©ØŒ ØºÙŠØ±Ù‡ ÙŠØ³ØªØ®Ø¯Ù… STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `âš ï¸ Ù„Ù… ÙŠÙØ±Ø³ÙŽÙ„ Ø¨Ø±ÙŠØ¯ Ø¥Ù„Ù‰ ${to} Ù„Ø£Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª SMTP ØºÙŠØ± Ù…ÙØ¹Ø¨Ù‘Ø£Ø© ÙÙŠ .env.local (Ù‡Ø°Ø§ Ù„Ø§ ÙŠÙˆÙ‚Ù Ø¹Ù…Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹)`
    );
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"leadybag" <no-reply@leadybag.com>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("âŒ ÙØ´Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ:", error);
    return false;
  }
}

// Ø¨Ø±ÙŠØ¯ Ø±Ù…Ø² Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø­Ø³Ø§Ø¨ (OTP) - ÙŠÙØ±Ø³ÙŽÙ„ ÙÙˆØ± Ø§Ù„ØªØ³Ø¬ÙŠÙ„
export async function sendVerificationCodeEmail(to: string, name: string, code: string) {
  await sendEmail(
    to,
    `Ø±Ù…Ø² ØªØ£ÙƒÙŠØ¯ Ø­Ø³Ø§Ø¨Ùƒ ÙÙŠ leadybag: ${code}`,
    `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #f0e6e8; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #B76E79; margin: 0; font-size: 28px; font-weight: bold;">leadybag</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">ÙˆØ¬Ù‡ØªÙƒ Ø§Ù„Ø£ÙˆÙ„Ù‰ Ù„Ù„Ø£Ù†Ø§Ù‚Ø©</p>
        </div>
        <h2 style="color: #1A1A2E; font-size: 18px; margin-top: 0;">Ù…Ø±Ø­Ø¨Ø§Ù‹ ${name} ðŸ‘‹</h2>
        <p style="color: #4A4A68; line-height: 1.6; font-size: 15px;">Ø´ÙƒØ±Ø§Ù‹ Ù„ØªØ³Ø¬ÙŠÙ„Ùƒ ÙÙŠ leadybag. Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ù„ØªÙØ¹ÙŠÙ„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ÙˆØ­Ø³Ø§Ø¨Ùƒ Ù‡Ùˆ:</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #FFF5F7; border: 2px dashed #B76E79; color: #B76E79; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 16px;">
            ${code}
          </div>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">ØµÙ„Ø§Ø­ÙŠØ© Ù‡Ø°Ø§ Ø§Ù„Ø±Ù…Ø² 15 Ø¯Ù‚ÙŠÙ‚Ø© ÙÙ‚Ø·. Ù„Ø§ ØªØ´Ø§Ø±Ùƒ Ù‡Ø°Ø§ Ø§Ù„Ø±Ù…Ø² Ù…Ø¹ Ø£ÙŠ Ø´Ø®Øµ.</p>
      </div>
    `
  );
}

// Ø¨Ø±ÙŠØ¯ Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±
export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  await sendEmail(
    to,
    `Ø±Ù…Ø² Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±: ${code}`,
    `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #f0e6e8; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #B76E79; margin: 0; font-size: 28px; font-weight: bold;">leadybag</h1>
        </div>
        <h2 style="color: #1A1A2E; font-size: 18px; margin-top: 0;">Ø·Ù„Ø¨ Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ðŸ”</h2>
        <p style="color: #4A4A68; line-height: 1.6; font-size: 15px;">ØªÙ„Ù‚ÙŠÙ†Ø§ Ø·Ù„Ø¨Ø§Ù‹ Ù„Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù„Ø­Ø³Ø§Ø¨Ùƒ (${name}). Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø³Ø±ÙŠ Ù‡Ùˆ:</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #FFF5F7; border: 2px dashed #B76E79; color: #B76E79; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 16px;">
            ${code}
          </div>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ø±Ù…Ø² 15 Ø¯Ù‚ÙŠÙ‚Ø©. Ø¥Ø°Ø§ Ù„Ù… ØªØ·Ù„Ø¨ Ù‡Ø°Ø§ Ø§Ù„ØªØºÙŠÙŠØ±ØŒ ÙŠØ±Ø¬Ù‰ ØªØ¬Ø§Ù‡Ù„ Ù‡Ø°Ù‡ Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙÙˆØ±Ø§Ù‹.</p>
      </div>
    `
  );
}

// Ø¨Ø±ÙŠØ¯ ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ù‚Ø¯ÙŠÙ… (Ø±Ø§Ø¨Ø· Ù…Ø¨Ø§Ø´Ø±)
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  await sendEmail(
    to,
    "ÙØ¹Ù‘Ù„ Ø­Ø³Ø§Ø¨Ùƒ ÙÙŠ leadybag",
    `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #B76E79;">Ù…Ø±Ø­Ø¨Ø§Ù‹ ${name} ðŸ‘‹</h2>
        <p>Ø´ÙƒØ±Ø§Ù‹ Ù„ØªØ³Ø¬ÙŠÙ„Ùƒ ÙÙŠ Ù…ØªØ¬Ø± leadybag. Ø§Ø¶ØºØ· Ø§Ù„Ø²Ø± Ø£Ø¯Ù†Ø§Ù‡ Ù„ØªÙØ¹ÙŠÙ„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ:</p>
        <a href="${verifyUrl}" style="display:inline-block; background:#B76E79; color:white; padding:12px 24px; border-radius:999px; text-decoration:none; margin:16px 0;">
          ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨
        </a>
        <p style="color:#888; font-size:13px;">Ù‡Ø°Ø§ Ø§Ù„Ø±Ø§Ø¨Ø· ØµØ§Ù„Ø­ Ù„Ù…Ø¯Ø© 24 Ø³Ø§Ø¹Ø©. Ø¥Ø°Ø§ Ù„Ù… ØªÙÙ†Ø´Ø¦ Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨ØŒ ØªØ¬Ø§Ù‡Ù„ Ù‡Ø°Ù‡ Ø§Ù„Ø±Ø³Ø§Ù„Ø©.</p>
      </div>
    `
  );
}

// Ø¨Ø±ÙŠØ¯ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø·Ù„Ø¨ - ÙŠÙØ±Ø³ÙŽÙ„ ÙÙˆØ± Ø¥ØªÙ…Ø§Ù… Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø´Ø±Ø§Ø¡
export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  trackingNumber: string,
  total: number
) {
  await sendEmail(
    to,
    `ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨Ùƒ ÙÙŠ leadybag - ${trackingNumber}`,
    `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #B76E79;">Ø´ÙƒØ±Ø§Ù‹ Ù„Ø·Ù„Ø¨Ùƒ ÙŠØ§ ${name} ðŸŽ‰</h2>
        <p>ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­ ÙˆØ³Ù†Ø¨Ø¯Ø£ Ø¨ØªØ¬Ù‡ÙŠØ²Ù‡ ÙÙˆØ±Ø§Ù‹.</p>
        <p><strong>Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹:</strong> ${trackingNumber}</p>
        <p><strong>Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ:</strong> ${total} SDG</p>
      </div>
    `
  );
}


