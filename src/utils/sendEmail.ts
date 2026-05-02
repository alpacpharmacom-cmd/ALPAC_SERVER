import nodemailer from 'nodemailer';
import { config } from './config';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: config.EMAIL_SERVICE,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `${config.FROM_EMAIL}`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending email:', error);
    // We don't throw here to avoid failing the order process if email fails
  }
};
