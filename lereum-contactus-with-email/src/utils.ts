import * as AWS from "aws-sdk";
import type { APIGatewayEvent } from "aws-lambda";
import { jsonContentType } from "./schemas";
import { SES } from "aws-sdk";
import * as fileType from "file-type";
import * as nodemailer from "nodemailer";

const ses = new SES({ region: "us-east-1" });
const s3 = new AWS.S3();

export const getContentType = (event: APIGatewayEvent) => {
  console.log("Headers are");
  console.log(event.headers);
  return event.headers["Content-Type"] || event.headers["content-type"];
};

export const getPayload = async (event: APIGatewayEvent) => {
  await jsonContentType.validate(getContentType(event));
  //console.log("body is");
  //console.log(event.body);
  return JSON.parse(event.body);
};

export const createSESSendEmailParams = (
  source: string,
  destination: string,
  email: string,
  name: string,
  innerMessage: string,
  nationality: string,
  phoneNumber: string
): SES.Types.SendTemplatedEmailRequest => {
  return {
    Template: "ContactUs",
    Destination: {
      ToAddresses: [destination],
    },
    Source: source,
    TemplateData: JSON.stringify({
      emailType: "Contact",
      email,
      fullName: name,
      innerMessage,
      nationality,
      phoneNumber,
    }),
  };
};

export const createSESSendEmailParamsForPartnerShip = (
  source: string,
  destination: string,
  email: string,
  name: string,
  innerMessage: string,
  nationality: string,
  phoneNumber: string,
  partnerShipType: string
): SES.Types.SendTemplatedEmailRequest => {
  return {
    Template: "PartnerShip",
    Destination: {
      ToAddresses: [destination],
    },
    Source: source,
    TemplateData: JSON.stringify({
      emailType: "PartnerShip",
      email,
      fullName: name,
      innerMessage,
      nationality,
      phoneNumber,
      partnerShipType,
    }),
  };
};

export const uploadCVToS3 = async (event: APIGatewayEvent, headers) => {
  //get event body
  const body = await getPayload(event);
  const { base64CV, jobTitle, name } = body;

  //trasnform the cv to buffer
  const decodedCV = Buffer.from(base64CV, "base64");

  //Get the file mime type
  const fileMimeType = await fileType.fromBuffer(decodedCV);

  // chek if file mime type is valid
  if (fileMimeType === null || fileMimeType === undefined) {
    return {
      statusCode: 500,
      body: "The file you have sent isn't valid",
      headers,
    };
  }

  //if a job title is specified, we need to send the job title to the server
  // else we can add the file to the others folder
  let filePath = "";
  if (jobTitle) {
    filePath = jobTitle + "/" + name + "." + fileMimeType.ext;
  } else {
    filePath = "Others" + "/" + name + "." + fileMimeType.ext;
  }

  //s3 upload params
  const params = {
    Body: decodedCV,
    Bucket: "lereum-jobopening-bucket2",
    Key: filePath,
  };

  //upload
  const uploaded = await s3.upload(params).promise();
  if (uploaded) {
    return uploaded.Key;
  }
};

export const getS3File = async (bucket, key) => {
  return s3.getObject({ Bucket: bucket, Key: key }).promise();
};

export const sendEmailWithAttach = async (event: APIGatewayEvent) => {
  //Get the body object
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

  //This the file key in aws , the format is the folder name
  // then followed by the file name
  const key = jobTitle + "/" + body.name + ".pdf";

  //S3 bucket
  const bucket = "lereum-jobopening-bucket2";

  //This function gets the s3 file uploaded to s3 so that it can be used
  // and sent as an attachement to the hr email
  const attach = await getS3File(bucket, key);


  //node mailer options for sending an email
  const mailOptions = {
    from: "auto@auto.lereum.com",
    subject: "New Job Application!",
    html:       `<p>You got a contact message from: <b>${from}</b></p>
                <p>My Name Is : <b>${name}</b></p>
                <p>Applying As : <b>${jobTitle}</b></p>
                <p><p>Job Location: <b>${jobLocation}</b></p>
                <p>Nationality : <b>${nationality}</b></p>
                <p>My Phone: <b>${phoneNumber}</b></p>
                <p>Message: <b>${message}</b></p>`,
    to: "hr@lereum.com",
    attachments: [
      {
        // be sure to specify the encoding and  content to be base64 
        filename: body.name + ".pdf",
        content: attach.Body.toString("base64"),
        encoding: "base64",
      },
    ],
  };
  console.log(mailOptions);

  // the transporter constructor with ses and nodemailer
  const transporter = nodemailer.createTransport({
    SES: ses,
  });

  //send email
  const sentRes = transporter.sendMail(mailOptions);
  console.log(await sentRes);
  return true;
};
