'use server';
// server/services/conferenceSmsService.js
import twilio from 'twilio';

export async function sendConferenceSmS(phoneNumber, conferenceUrl) {
    console.log('Starting conference SMS notification process...', {
        phoneNumber,
        hasUrl: !!conferenceUrl
    });

    try {
        // Check required environment variables
        const requiredEnvVars = ['TWILLIO_ACCOUNT_SID', 'TWILLIO_AUTH_TOKEN', 'TWILLIO_PHONE_NUMBER'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('Missing required environment variables:', missingVars);
            throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
        }

        const client = twilio(process.env.TWILLIO_ACCOUNT_SID, process.env.TWILLIO_AUTH_TOKEN);

        const message = `A customer is waiting for you in a conference. Join now: ${conferenceUrl}`;

        console.log('Preparing to send conference SMS notification:', {
            to: phoneNumber,
            from: process.env.TWILLIO_PHONE_NUMBER
        });

        try {
            const response = await client.messages.create({
                to: phoneNumber,
                from: process.env.TWILLIO_PHONE_NUMBER,
                body: message
            });

            console.log('Twilio API Response:', {
                sid: response.sid,
                status: response.status
            });

            return {
                success: true,
                message: 'Conference SMS notification sent successfully',
                details: {
                    sid: response.sid,
                    status: response.status
                }
            };

        } catch (twilioError) {
            console.error('Twilio send error:', {
                error: twilioError.message,
                code: twilioError.code
            });
            throw twilioError;
        }

    } catch (error) {
        console.error('Error in sendConferenceSMS:', {
            error: error.message,
            stack: error.stack,
            name: error.name
        });

        return {
            success: false,
            error: 'Failed to send conference SMS notification',
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                stack: error.stack
            } : undefined
        };
    }
}