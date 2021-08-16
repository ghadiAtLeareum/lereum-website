import apiResponses from "../helpers/apiResponses";
import { APIGatewayProxyHandler } from "aws-lambda";
import { SignupHelpers } from "../helpers/signupHelpers";
const signupHelpers = new SignupHelpers();
import "source-map-support/register";
import { v4 as uuidv4 } from "uuid";
import { Console } from "console";
import { Lambda } from "aws-sdk";

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body);
  const email = body.email;
  const recaptchaToken = body.recaptchaToken;
  const agreement = body.agreement;
  

  if (!recaptchaToken) {
    return apiResponses._400({ message: "missing text fom the body" });
  }
  if (!agreement) {
    return apiResponses._400({ message: "missing agreement from the body" });
  }

  if (!email) {
    return apiResponses._400({ message: "missing email from the body" });
  }

  var recaptchaResult = await signupHelpers.verifyRecaptcha(
    body.recaptchaToken
  );
  console.log(recaptchaResult);
  if (!recaptchaResult) {
    console.log(recaptchaResult);
  }

  let cognitoCheckUserResult = await signupHelpers.checkEmailExisted(
    body.email
  );
  try {
    if (cognitoCheckUserResult) {
      //for security reasons we return 200 if email is found
      return apiResponses._200({ message: "you can not use this email" });
    }
  } catch (err) {
    return err;
  }

  try {
    var dynamoResult = await signupHelpers.checkIfUserExistsInDynamo(
      body.email
    );

    if (!dynamoResult) {
      let id = uuidv4();
      let recipient = JSON.stringify(email);
      let lastName = JSON.stringify(body.lastName);
      let firstName = JSON.stringify(body.firstName);
      let token = JSON.stringify(Math.floor(100000 + Math.random() * 900000));
      let createdAt = Date.now();
      let expiresAt = Math.floor(Date.now() / 1000) + 86400;

      console.log(id , recipient , token , firstName , lastName)
      const dynamoInsertResult = await signupHelpers.upsertSignupUserToDynamoDb(
        id,
        recipient,
        token,
        firstName,
        lastName,
        createdAt,
        expiresAt
      );
      if (dynamoInsertResult) {
        return apiResponses._200({ message: "User Inserted" });
      } else return apiResponses._400({ message: "cannot insert user" });
    }
  } catch (err) {
    console.log("Error:", err);
    return apiResponses._400({ message: "error" });
  }
};
