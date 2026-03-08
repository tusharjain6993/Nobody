import nodemailer from "nodemailer";

let transporter = null;
let useEthereal = false;

async function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass && pass !== "PUT_YOUR_16_CHAR_APP_PASSWORD_HERE") {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    console.log("📧 Email: Using Gmail SMTP");
    return transporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  useEthereal = true;
  console.log("📧 Email: Using Ethereal test account (emails viewable via preview URL)");
  return transporter;
}

export async function sendOtpEmail(to, otp) {
  const t = await getTransporter();

  const mailOptions = {
    from: `"HCM Portal" <noreply@hcmportal.gov>`,
    to,
    subject: "Your OTP for HCM Portal Registration",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#f8fafc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;line-height:56px;font-size:1.6rem;">&#127963;</div>
          <h2 style="margin:0.75rem 0 0;color:#0f172a;">HCM Portal</h2>
        </div>
        <div style="background:#fff;border-radius:10px;padding:1.5rem;border:1px solid #e2e8f0;">
          <p style="color:#334155;margin:0 0 1rem;">Hello! Your one-time verification code is:</p>
          <div style="text-align:center;padding:1rem;background:#f1f5f9;border-radius:8px;margin-bottom:1rem;">
            <span style="font-size:2rem;font-weight:800;letter-spacing:0.5rem;color:#6366f1;">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:0.85rem;margin:0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:0.75rem;margin-top:1.5rem;">&copy; 2026 HCM Portal</p>
      </div>
    `,
  };

  const info = await t.sendMail(mailOptions);

  if (useEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  OTP for ${to}: ${otp}                    `);
    console.log(`║  📧 View email: ${previewUrl}`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
  } else {
    console.log(`✅ Real OTP email sent to ${to}`);
  }

  return info;
}
