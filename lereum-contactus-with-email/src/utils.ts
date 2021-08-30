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
  const body = await getPayload(event);
  const { base64CV, jobTitle, name } = body;

  const decodedCV = Buffer.from(base64CV, "base64");
  const fileMimeType = await fileType.fromBuffer(decodedCV);

  console.log("The file type is");
  console.log(fileMimeType);

  if (fileMimeType === null || fileMimeType === undefined) {
    return {
      statusCode: 500,
      body: "The file you have sent isn't valid",
      headers,
    };
  }

  let filePath = "";
  if (jobTitle) {
    filePath = jobTitle + "/" + name + "." + fileMimeType.ext;
  } else {
    filePath = "Others" + "/" + name + "." + fileMimeType.ext;
  }

  const params = {
    Body: decodedCV,
    Bucket: "lereum-jobopening-bucket2",
    Key: filePath,
  };

  const uploaded = await s3.upload(params).promise();
  if (uploaded) {
    return uploaded.Key;
  }
};

export const getS3File = async (bucket, key) => {
  return s3.getObject({ Bucket: bucket, Key: key }).promise();
};

export const sendEmailWithAttach = async (event: APIGatewayEvent) => {
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
      return err;
    } else {
      return true;
    }
  });
};
