import * as AWS from "aws-sdk";
import type { APIGatewayEvent } from "aws-lambda";
import { jsonContentType } from "./schemas";
import { SES } from "aws-sdk";
import * as fileType from "file-type";

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

export const getCvURL = (Bucket, fileName, jobTitle) => {
  return `https://${Bucket}.s3.amazonaws.com/${jobTitle}/${fileName}`;
};
