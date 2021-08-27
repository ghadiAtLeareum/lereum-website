import { AWSError, SES } from "aws-sdk";
import { S3 } from "aws-sdk";
const s3 = new S3();
import { format } from "util";
import { sourceEmail, targetEmail } from "../config";
import type {
  Context,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  uploadCVToS3,
  getCvURL,
  getPayload,
  createSESSendEmailParamsForJobOpening,
} from "../utils";

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

      const body = await getPayload(event);
      const { name, from, message, nationality, phoneNumber, jobTitle , jobLocation} = body;
      console.log("This is the body");

      const key = body.name + ".pdf";
      const bucket = "lereum-jobopening-bucket2";
      const cvURL = getCvURL(bucket, key, jobTitle);
      console.log("this is the cv url");
      console.log(cvURL.replace(/\s+/g, ''));

      const params = createSESSendEmailParamsForJobOpening(
        sourceEmail,
        targetEmail,
        from,
        name,
        message,
        nationality,
        phoneNumber,
        jobTitle,
        jobLocation,
        cvURL
      );

      console.log("Those are the email params");
      console.log(params)

      const result = await ses.sendTemplatedEmail(params).promise();
      
      return {
        statusCode: 200,
        body:
          "CV added successfully , and email sent to " +
          targetEmail ,
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
