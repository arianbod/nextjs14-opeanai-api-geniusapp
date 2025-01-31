'use server';
// server/services/conferenceEmailService.js
import sgMail from '@sendgrid/mail';

export async function sendConferenceNotification(email, conferenceUrl) {
    console.log('Starting conference notification process...', {
        email,
        hasUrl: !!conferenceUrl
    });

    try {
        // Check required environment variables
        const requiredEnvVars = ['SENDGRID_API_KEY', 'FROM_EMAIL', 'FROM_NAME'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('Missing required environment variables:', missingVars);
            throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
        }

        console.log('Setting SendGrid API key...');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: email,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME
            },
            subject: 'Customer Waiting in Conference',
            text: `A customer is waiting for you in a conference. Join now: ${conferenceUrl}`,
            html: `
                <div style="padding: 20px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">Customer Waiting</h2>
                    <p style="font-size: 18px; text-align: center; color: #555;">
                        A customer is waiting for you in a conference
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${conferenceUrl}" 
                           style="display: inline-block; padding: 15px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
                            Join Now
                        </a>
                    </div>
                    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
                        powered by BabaAI Conference!
                    </p>
                </div>
            `
        };

        console.log('Preparing to send conference notification:', {
            to: msg.to,
            from: msg.from,
            subject: msg.subject
        });

        try {
            const [response] = await sgMail.send(msg);
            console.log('SendGrid API Response:', {
                statusCode: response.statusCode,
                headers: response.headers
            });

            if (response.statusCode !== 202) {
                throw new Error(`SendGrid API error: ${response.statusCode}`);
            }

            console.log('Conference notification sent successfully!');
            return {
                success: true,
                message: 'Conference notification sent successfully',
                details: {
                    statusCode: response.statusCode,
                    messageId: response.headers['x-message-id']
                }
            };

        } catch (sendError) {
            console.error('SendGrid send error:', {
                error: sendError.message,
                code: sendError.code,
                response: sendError.response?.body
            });
            throw sendError;
        }

    } catch (error) {
        console.error('Error in sendConferenceNotification:', {
            error: error.message,
            stack: error.stack,
            name: error.name
        });

        return {
            success: false,
            error: 'Failed to send conference notification',
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                response: error.response?.body,
                stack: error.stack
            } : undefined
        };
    }
}