import { BrevoClient } from '@getbrevo/brevo';

// Set up the brevo client.
const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY as string
});

/**
 * Sends the login code to the user.
 * @param {string} email - email that the user would have provided.
 * @param {string} code  - code to be forwarded to the user.
 */
export async function sendLoginCode(email: string, code: string) {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: { 
            name: 'Tenjin', 
            email: process.env.MAIL_FROM as string 
        },
        to: [{ email }],
        subject: `Your Tenjin code: ${code}`,
        textContent: `Your Tenjin login code is ${code}. It expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`
    });
}