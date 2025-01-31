'use server';
// server/services/conferenceEmailService.js
import sgMail from '@sendgrid/mail';

function formatMessagesHtml(messages) {
    if (!messages || !Array.isArray(messages)) return '';

    return messages.map(msg => `
        <div style="margin: 10px 0; padding: 10px; border-radius: 8px; background-color: ${msg.role === 'user' ? '#f3f4f6' : '#e8f0fe'};">
            <div style="font-weight: 600; margin-bottom: 5px; color: ${msg.role === 'user' ? '#374151' : '#1e40af'};">
                ${msg.role === 'user' ? 'Customer' : 'Assistant'}
            </div>
            <div style="color: #1f2937;">
                ${msg.content}
            </div>
            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 5px;">
                ${new Date(msg.timestamp).toLocaleString()}
            </div>
        </div>
    `).join('');
}

export async function sendConferenceNotification(email, conferenceUrl, messages) {
    console.log('Starting conference notification process...', {
        email,
        hasUrl: !!conferenceUrl,
        messageCount: messages?.length
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

        const messagesHtml = formatMessagesHtml(messages);

        const msg = {
            to: email,
            from: {
                email: process.env.FROM_EMAIL,
                name: process.env.FROM_NAME
            },
            subject: 'Customer Waiting in Conference',
            text: `A customer is waiting for you in a conference. Join now: ${conferenceUrl}\n\nChat History:\n${messages?.map(m => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`).join('\n') || ''
                }`,
            html: `
                <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
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
                    ${messages?.length ? `
                        <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                            <h3 style="color: #333; margin-bottom: 15px;">Chat History</h3>
                            <div style="background-color: white; border-radius: 8px; padding: 15px;">
                                ${messagesHtml}
                            </div>
                        </div>
                    ` : ''}
                    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
                        powered by BabaAI Conference!
                    </p>
                </div>
            `
        };

        console.log('Preparing to send conference notification:', {
            to: msg.to,
            from: msg.from,
            subject: msg.subject,
            includesMessages: !!messages?.length
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