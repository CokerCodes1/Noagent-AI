const { Resend } = require("resend");

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// IMPORTANT FOR LOCAL TESTING:
// Until you verify a domain in Resend, the MAIL_FROM *must* be onboarding@resend.dev
const MAIL_FROM = process.env.MAIL_FROM || "onboarding@resend.dev"; 
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "NoAgentNaija";
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || "no-reply@noagentnaija.com";

function getFromAddress() {
  return `${MAIL_FROM_NAME} <${MAIL_FROM}>`;
}

function getInboxHeaders() {
  return {
    "X-Auto-Response-Suppress": "OOF, DR, RN, NRN, AutoReply",
    "Auto-Submitted": "auto-generated"
  };
}

async function sendPasswordResetEmail({ name, to, resetCode, expiresInMinutes }) {
  const subject = "Your NoAgentNaija password reset code";
  const greetingName = name ? name.trim().split(/\s+/)[0] : "there";
  
  const text = [
    `Hi ${greetingName},`,
    "",
    "We received a request to reset your NoAgentNaija password.",
    `Your one-time reset code is: ${resetCode}`,
    `This code expires in ${expiresInMinutes} minutes.`,
    "",
    "Enter the code in the NoAgentNaija reset password popup and choose a new password to continue.",
    "",
    `If you did not request this, you can ignore this email or contact us at ${MAIL_REPLY_TO}.`,
    "",
    `Sign in: ${FRONTEND_URL}`
  ].join("\n");

  const html = `
    <div style="margin:0;padding:24px;background:#f6efe6;color:#211407;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#fff8ef;border:1px solid rgba(89,52,24,.14);border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 20px;background:linear-gradient(135deg,#3f2312,#b85c38);color:#fff7f1;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">NoAgentNaija</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Password reset code</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;font-size:16px;">Hi ${greetingName},</p>
          <p style="margin:0 0 18px;line-height:1.7;">
            We received a request to reset your NoAgentNaija password. Use the one-time code below in the reset password popup, then choose a new password to sign back in.
          </p>
          <div style="margin:0 0 18px;padding:18px 20px;border-radius:20px;background:#f5efe5;border:1px solid rgba(89,52,24,.14);text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#5a4330;">Reset code</p>
            <p style="margin:0;font-size:34px;font-weight:700;letter-spacing:.32em;color:#8f4325;">${resetCode}</p>
          </div>
          <p style="margin:0 0 8px;line-height:1.7;">This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
          <p style="margin:0 0 18px;line-height:1.7;">If you did not request this reset, you can safely ignore this email.</p>
          <p style="margin:0;line-height:1.7;color:#5a4330;">Need help? Reply to this email or visit <a href="${FRONTEND_URL}" style="color:#8f4325;">NoAgentNaija</a>.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to], // Resend expects an array for 'to'
      replyTo: MAIL_REPLY_TO,
      subject,
      text,
      html,
      headers: getInboxHeaders()
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully! Message ID:", data.id);
    
    return {
      mode: "resend",
      messageId: data.id
    };

  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail
};