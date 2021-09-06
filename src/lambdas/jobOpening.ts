import { targetEmail } from "../config";
import type {
  Context,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { uploadCVToS3, sendEmailWithAttach } from "../utils";

export async function sendemailwithresume(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "https://www.lereum.com",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };
  try {
    const result = await uploadCVToS3(event, headers);
    if (result) {
      const res = await sendEmailWithAttach(event);
      if (res) {
        return {
          statusCode: 200,
          body: "CV added successfully , and email sent to " + targetEmail,
          headers,
        };
      }
    }
  } catch (e) {
    console.error("An exception was thrown!");
    console.error(e.message);
    console.error(e);
    const isValidationError = e.name === "ValidationError";
    return {
      statusCode: isValidationError ? 400 : 500,
      body: e.message,
      headers,
    };
  }
}
