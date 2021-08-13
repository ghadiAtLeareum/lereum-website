import * as AWS from "aws-sdk";
const documentClient = new AWS.DynamoDB.DocumentClient();
import * as _dynamodbAutoMarshaller from "@aws/dynamodb-auto-marshaller";
const marshaller = new _dynamodbAutoMarshaller.Marshaller();
import * as axios from "axios";
import { environment } from "../environment";
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

export class SignupHelpers {
  verificationTable: string;
  clientPool: string;
  googleRecaptchaSecret: string;
  recaptchaToken: string;
  email: string;
  constructor() {
    this.verificationTable = environment.VERIFICATION_DYNAMODB_TABLE;
    this.clientPool = environment.CLIENT_POOL_ID;
    this.googleRecaptchaSecret = environment.GOOGLE_RECAPTCHA_SECRET;

    this.verifyRecaptcha(this.recaptchaToken);
    this.checkEmailExisted(this.email);
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
}
