import nodemailer from 'nodemailer';

// Set up the nodemailer.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Sends the login code to the user.
 * @param {string} email - email that the user would have provided.
 * @param {string} code  - code to be forwarded to the user.
 */
export async function sendLoginCode(email: string, code: string) {
    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: `Your Tenjin code: ${code}`,
        text: `Your Tenjin login code is ${code}. It expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`
    });
}