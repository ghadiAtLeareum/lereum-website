import * as AWS from "aws-sdk";
import * as _dynamodbAutoMarshaller from "@aws/dynamodb-auto-marshaller";
import * as axios from "axios";
import { environment } from "../environment";
import { create } from "domain";
const dynamoDb = new AWS.DynamoDB();
const documentClient = new AWS.DynamoDB.DocumentClient();
const marshaller = new _dynamodbAutoMarshaller.Marshaller();
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

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

  constructor() {
    this.verificationTable = environment.VERIFICATION_DYNAMODB_TABLE;
    this.clientPool = environment.CLIENT_POOL_ID;
    this.googleRecaptchaSecret = environment.GOOGLE_RECAPTCHA_SECRET;

    this.verifyRecaptcha(this.recaptchaToken);
    this.checkEmailExisted(this.email);
    this.checkIfUserExistsInDynamo(this.email);
    this.upsertSignupUserToDynamoDb(
      this.id,
      this.email,
      this.token,
      this.firstName,
      this.lastName,
      this.createdAt,
      this.expiresAt
    );
  }

  async verifyRecaptcha(recaptchaToken: string) {
    const payload = {
      secret: this.googleRecaptchaSecret,
      response: recaptchaToken,
      remoteip: undefined,
    };
    const verifyResponse = await axios.default({
      method: "post",
      url: "https://www.google.com/recaptcha/api/siteverify",
      params: payload,
    });
    return verifyResponse.data.success;
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

  upsertSignupUserToDynamoDb = async (
    id: string,
    email: string,
    token: string,
    firstName: string,
    lastName: string,
    expiresAt: number,
    createdAt: number
  ) => {
    const params = {
      "TableName": "verification",
      Item: {
        "recipient": {
          S: email,
        },
        "type": {
          S: "SIGN_UP_EMAIL",
        },
        "id": {
          S: id,
        },
        "payload": {
          M: {
            "userId": {
              S: id,
            },
            "firstName": {
              S: firstName,
            },
            "lastName": {
              S: lastName,
            },
            "email": {
              S: email,
            },
            "createdAt": {
              N: createdAt,
            },
          },
        },
        "token": {
          S: token,
        },
        "created_at": {
          N: createdAt,
        },
        "expiresAt": {
          N: expiresAt,
        },
      },
    };
    console.log(params)
    console.log("Adding a new item...");
    const result = await documentClient.put(params).promise()
    if (result) return result
  };
}
