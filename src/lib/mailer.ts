// src/lib/mailer.ts
// أداة موحدة لإرسال البريد الإلكتروني (تفعيل الحساب، تأكيد الطلبات، إلخ)
// نستخدم Nodemailer مع أي خدمة SMTP (Gmail، أو خدمات مخصصة مثل Brevo/SendGrid المجانية)
//
// ملاحظة مهمة: إذا لم تُعبَّأ إعدادات SMTP في .env.local، الموقع لا يتعطل أبداً -
// فقط لا يُرسَل البريد فعلياً، ويُطبع تنبيه في الـ Terminal بدلاً من رمي خطأ يوقف التسجيل

import nodemailer from "nodemailer";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // SMTP غير مُعدّ بعد - نتعامل مع هذا بلطف في sendEmail أدناه
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // المنفذ 465 يستخدم SSL مباشرة، غيره يستخدم STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `⚠️ لم يُرسَل بريد إلى ${to} لأن إعدادات SMTP غير مُعبّأة في .env.local (هذا لا يوقف عمل الموقع)`
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
    console.error("❌ فشل إرسال البريد الإلكتروني:", error);
    return false;
  }
}

// بريد رمز مصادقة الحساب (OTP) - يُرسَل فور التسجيل
export async function sendVerificationCodeEmail(to: string, name: string, code: string) {
  await sendEmail(
    to,
    `رمز تأكيد حسابك في leadybag: ${code}`,
    `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #f0e6e8; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #B76E79; margin: 0; font-size: 28px; font-weight: bold;">leadybag</h1>
          <p style="color: #666; font-size: 14px; margin-top: 4px;">وجهتك الأولى للأناقة</p>
        </div>
        <h2 style="color: #1A1A2E; font-size: 18px; margin-top: 0;">مرحباً ${name} 👋</h2>
        <p style="color: #4A4A68; line-height: 1.6; font-size: 15px;">شكراً لتسجيلك في leadybag. رمز التحقق لتفعيل بريدك الإلكتروني وحسابك هو:</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #FFF5F7; border: 2px dashed #B76E79; color: #B76E79; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 16px;">
            ${code}
          </div>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">صلاحية هذا الرمز 15 دقيقة فقط. لا تشارك هذا الرمز مع أي شخص.</p>
      </div>
    `
  );
}

// بريد استعادة كلمة المرور
export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  await sendEmail(
    to,
    `رمز إعادة تعيين كلمة المرور: ${code}`,
    `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #f0e6e8; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #B76E79; margin: 0; font-size: 28px; font-weight: bold;">leadybag</h1>
        </div>
        <h2 style="color: #1A1A2E; font-size: 18px; margin-top: 0;">طلب استعادة كلمة المرور 🔐</h2>
        <p style="color: #4A4A68; line-height: 1.6; font-size: 15px;">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك (${name}). الرمز السري هو:</p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #FFF5F7; border: 2px dashed #B76E79; color: #B76E79; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 16px;">
            ${code}
          </div>
        </div>
        <p style="color: #888; font-size: 13px; text-align: center;">صلاحية الرمز 15 دقيقة. إذا لم تطلب هذا التغيير، يرجى تجاهل هذه الرسالة فوراً.</p>
      </div>
    `
  );
}

// بريد تفعيل الحساب القديم (رابط مباشر)
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  await sendEmail(
    to,
    "فعّل حسابك في leadybag",
    `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #B76E79;">مرحباً ${name} 👋</h2>
        <p>شكراً لتسجيلك في متجر leadybag. اضغط الزر أدناه لتفعيل بريدك الإلكتروني:</p>
        <a href="${verifyUrl}" style="display:inline-block; background:#B76E79; color:white; padding:12px 24px; border-radius:999px; text-decoration:none; margin:16px 0;">
          تفعيل الحساب
        </a>
        <p style="color:#888; font-size:13px;">هذا الرابط صالح لمدة 24 ساعة. إذا لم تُنشئ هذا الحساب، تجاهل هذه الرسالة.</p>
      </div>
    `
  );
}

// بريد تأكيد الطلب - يُرسَل فور إتمام عملية الشراء
export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  trackingNumber: string,
  total: number
) {
  await sendEmail(
    to,
    `تم استلام طلبك في leadybag - ${trackingNumber}`,
    `
      <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #B76E79;">شكراً لطلبك يا ${name} 🎉</h2>
        <p>تم استلام طلبك بنجاح وسنبدأ بتجهيزه فوراً.</p>
        <p><strong>رقم التتبع:</strong> ${trackingNumber}</p>
        <p><strong>الإجمالي:</strong> ${total} SDG</p>
      </div>
    `
  );
}


