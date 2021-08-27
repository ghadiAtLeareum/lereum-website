import { AWSError, SES } from "aws-sdk";
import { S3 } from "aws-sdk";
const s3 = new S3();
import { format } from "util";
import type {
  Context,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { uploadCVToS3, getCvURL, getPayload } from "../utils";

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
    console.log("started sending email");
    const result = await uploadCVToS3(event, headers);
    if (result) {
      return {
        statusCode: 200,
        body: "CV added successfully",
        headers,
      };
    }

    const body = await getPayload(event);
    const key = body.name + ".pdf";
    const cvURL = getCvURL(key);
    console.log(cvURL);
    
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
