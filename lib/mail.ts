import nodemailer from "nodemailer";

interface MailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  duration: number;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const defaultPort = process.env.SMTP_DEFAULT_PORT || "587";
    const port = parseInt(process.env.SMTP_PORT || defaultPort, 10);
    const user = process.env.SMTP_USER;
    // Support both SMTP_PASS and SMTP_PASSWORD for flexibility
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    // Support SMTP_SECURE if provided, otherwise default based on port
    const securePort = parseInt(process.env.SMTP_SECURE_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE 
      ? process.env.SMTP_SECURE.toLowerCase() === "true"
      : port === securePort;

    // Debug: Check which variables are missing
    const missing: string[] = [];
    if (!host) missing.push("SMTP_HOST");
    if (!user) missing.push("SMTP_USER");
    if (!pass) missing.push("SMTP_PASS or SMTP_PASSWORD");
    
    if (missing.length > 0) {
      throw new Error(
        `SMTP configuration missing. Please set the following in .env.local: ${missing.join(", ")}. ` +
        `Current values: SMTP_HOST=${host ? "set" : "missing"}, SMTP_USER=${user ? "set" : "missing"}, SMTP_PASS/SMTP_PASSWORD=${pass ? "set" : "missing"}, SMTP_PORT=${process.env.SMTP_PORT || `default(${defaultPort})`}`
      );
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

export async function sendEmail(
  options: MailOptions
): Promise<SendResult> {
  const startTime = Date.now();
  
  try {
    const mailTransporter = getTransporter();
    const info = await mailTransporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
    return true;
  } catch {
    return false;
  }
}

