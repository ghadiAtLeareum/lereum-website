import { SES } from 'aws-sdk';
import { format } from 'util';
import type { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { email, sendEmailSchema, recaptchaV2VerificationSchema } from '../schemas';
import { sourceEmail, targetEmail } from '../config';
import { createSESSendEmailParams, getPayload } from '../utils';

const ses = new SES({ region: "us-east-1" });

export async function sendemail(
    event: APIGatewayEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    const headers = {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "http://lereum.com",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    };
    try {
        console.log("Sending email to ", targetEmail);
        await email.validate(targetEmail);
        await email.validate(sourceEmail);
        const body = await getPayload(event);
        const { name, from, message, token, nationality, phoneNumber } = await sendEmailSchema.validate(body);
        //await recaptchaV2VerificationSchema.validate({ recaptchaToken: token });
        const params = createSESSendEmailParams(
            sourceEmail,
            targetEmail,
            from,
            name,
            message,
            nationality,
            phoneNumber
        );
        await ses.sendTemplatedEmail(params).promise();
        return {
            statusCode: 204,
            body: "Email sent",
            headers
        };
    } catch (e) {
        console.error("An exception was thrown!");
        console.error(e.message);
        console.error(e);
        const isValidationError = e.name === "ValidationError";
        return {
            statusCode: isValidationError ? 400 : 500,
            body: JSON.stringify({
                error: format("Invalid Request. Reason: %s", isValidationError ? e.message : "0")
            }),
            headers
        };
    }
}