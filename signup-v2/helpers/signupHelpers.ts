import apiResponses from "../helpers/apiResponses";
import * as AWS from "aws-sdk";
import * as axios from "axios";
import { environment } from "../environment";
const dynamoDb = new AWS.DynamoDB();
const documentClient = new AWS.DynamoDB.DocumentClient();
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
import { Marshaller } from "@aws/dynamodb-auto-marshaller";
const marshaller = new Marshaller({ unwrapNumbers: true });
const SES = new AWS.SES();
import { v4 as uuidv4 } from "uuid";

export class SignupHelpers {
  verificationTable: string;
  clientPool: string;
  googleRecaptchaSecret: string;
  recaptchaToken: string;
  id: string;
  recipient: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  email: string;
  lastName: string;
  firstName: string;
  item: {};

  constructor() {
    this.verificationTable = environment.VERIFICATION_DYNAMODB_TABLE;
    this.clientPool = environment.CLIENT_POOL_ID;
    this.googleRecaptchaSecret = environment.GOOGLE_RECAPTCHA_SECRET;

    this.verifyRecaptcha(this.recaptchaToken);
    this.checkEmailExisted(this.email);
    this.checkIfUserExistsInDynamo(this.email);
    this.upsertSignupUserToDynamoDb(this.item);
  }

  async verifyRecaptcha(recaptchaToken: string) {
    const payload = {
      secret: this.googleRecaptchaSecret,
      response: recaptchaToken,
      remoteip: undefined,
    };
    await axios.default({
      method: "post",
      url: "https://www.google.com/recaptcha/api/siteverify",
      params: payload,
    });
    return true;
  }

  checkEmailExisted = async (email: string) => {
    var params = {
      UserPoolId: this.clientPool,
      Filter: `email = \"${email}\"`,
    };
    var data = await cognitoidentityserviceprovider.listUsers(params).promise();
    if (data.Users.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  checkIfUserExistsInDynamo = async (email: string) => {
    const params = {
      TableName: "verification",
      KeyConditionExpression: "#DYNOBASE_recipient = :pkey",
      ExpressionAttributeValues: {
        ":pkey": email,
      },
      ExpressionAttributeNames: {
        "#DYNOBASE_recipient": "recipient",
      },
      ScanIndexForward: true,
    };
    const retrievedUser = await documentClient.query(params).promise();
    if (retrievedUser.Items.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  getUsernameInfo = async (email: string) => {
    const params = {
      TableName: "verification",
      KeyConditionExpression: "#DYNOBASE_recipient = :pkey",
      ExpressionAttributeValues: {
        ":pkey": email,
      },
      ExpressionAttributeNames: {
        "#DYNOBASE_recipient": "recipient",
      },
      ScanIndexForward: true,
    };
    const retrievedUser = await documentClient.query(params).promise();
    return retrievedUser;
  };

  upsertSignupUserToDynamoDb = async (item: Record<string, any>) => {
    console.log("item is");
    console.log(item);
    const params = {
      TableName: "verification",
      Item: marshaller.marshallItem(item),
    };
    console.log("params are");
    console.log(params);
    await dynamoDb.putItem(params).promise();
    return true;
  };

  async sendTokenEMAIL(email: string, firstName: string, email_token: string) {
    let base_url = "bitsouks123.com";
    let link_url = base_url + "/" + email + "/" + firstName + "/" + email_token;
    var params = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: link_url,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Bitsouks Verification Link",
        },
      },
      Source: "ghadi@lereum.com",
    };
    await SES.sendEmail(params).promise();
    return true;
  }
}
