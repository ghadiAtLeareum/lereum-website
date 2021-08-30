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
import { uploadCVToS3, getS3File, getPayload } from "../utils";

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
      const {
        name,
        from,
        message,
        nationality,
        phoneNumber,
        jobTitle,
        jobLocation,
      } = body;
      console.log("This is the body");

      const key = jobTitle + "/" + body.name + ".pdf";
      console.log("this is key");
      console.log(key);

      const bucket = "lereum-jobopening-bucket2";

      const attach = await getS3File(bucket, key);

      console.log("this is the s3 body");
      console.log(attach.Body);

      const mailOptions = {
        from: "auto@auto.lereum.com",
        subject: "New Job Application!",
        html: `<p>You got a contact message from: <b>${from}</b></p>
                <p>My Name Is : <b>${name}</b></p>
                <p>Applying As : <b>${jobTitle}</b></p>
                <p><p>Job Location: <b>${jobLocation}</b></p>
                <p>Nationality : <b>${nationality}</b></p>
                <p>My Phone: <b>${phoneNumber}</b></p>
                <p>Message: <b>${message}</b></p>`,
        to: "ghadi@lereum.com",
        bcc: ["hr@lereum.com"],
        attachments: [
          {
            filename: body.name + ".pdf",
            content: attach.Body.toString("base64"),
            encoding: "base64",
          },
        ],
      };
      console.log(mailOptions);

      const transporter = nodemailer.createTransport({
        SES: ses,
      });

      // send email
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.log(err);
          console.log("Error sending email");
        } else {
          console.log("Email sent successfully");
        }
      });

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
