import { AWSError, SES } from "aws-sdk";
import { S3 } from "aws-sdk";
const s3 = new S3();
import * as nodemailer from "nodemailer";
import { format } from "util";
import { sourceEmail, targetEmail } from "../config";
import type {
  Context,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { uploadCVToS3, sendEmailWithAttach } from "../utils";

const ses = new SES({ region: "us-east-1" });

export async function sendemailwithresume(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "http://lereum.com",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };
  try {
    const result = await uploadCVToS3(event, headers);
    if (result) {
      await sendEmailWithAttach(event);

      return {
        statusCode: 200,
        body: "CV added successfully , and email sent to " + targetEmail,
        headers,
      };
    }
  } catch (e) {
    console.error("An exception was thrown!");
    console.error(e.message);
    console.error(e);
    const isValidationError = e.name === "ValidationError";
    return {
      statusCode: isValidationError ? 400 : 500,
      body: JSON.stringify({
        error: format(
          "Invalid Request. Reason: %s",
          isValidationError ? e.message : "0"
        ),
      }),
      headers,
    };
  }
}
