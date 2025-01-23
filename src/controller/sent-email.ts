import * as nodemailer from "nodemailer";
import * as Handlebars from "handlebars";

const templateEngine = Handlebars.create();

interface EmailOptions {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  service: "Gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ from, to, cc, subject, body }: EmailOptions) {
  const mailOptions = { from, to, cc, subject, html: body };

  if (cc) {
    mailOptions.cc = cc;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
  }
}

export const replacePlaceholders = (template: string, data: any) => {
  const templateCompiled = templateEngine.compile(template);
  return templateCompiled(data);
};
