import apiResponses from "../helpers/apiResponses";
import { APIGatewayProxyHandler } from "aws-lambda";
import { SignupHelpers } from "../helpers/signupHelpers";
const signupHelpers = new SignupHelpers();
import "source-map-support/register";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const email = body.email;
  const recaptchaToken = body.recaptchaToken;
  const agreement = body.agreement;
  const firstName = body.firstName;
  const lastName = body.lastName;
  console.log(event);

  try {
    if (!recaptchaToken) {
      return apiResponses.error_400(
        { message: "missing text fom the body" },
        event
      );
    }
    if (!agreement) {
      return apiResponses.error_400(
        { message: "missing token fom the body" },
        event
      );
    }

    if (!email) {
      return apiResponses.error_400(
        { message: "missing email from the body" },
        event
      );
    }

    var recaptchaResult = await signupHelpers.verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult) {
      //const response = { statusCode: 400, body: recaptchaResult };
      //return response;
      console.log(recaptchaResult);
    }

    let cognitoCheckUserResult = await signupHelpers.checkEmailExisted(
      body.email
    );
    console.log("here is the cognito check");
    if (cognitoCheckUserResult) {
      //for security reasons we return 200 if email is found
      return apiResponses.error_200(
        { message: "you can not use this email" },
        event
      );
    }

    const dynamoDbCheckUserResult =
      await signupHelpers.checkIfUserExistsInDynamo(body.email);
    if (!dynamoDbCheckUserResult) {
      return apiResponses.error_400(
        { message: "User is not in the dynamo db" },
        event
      );
    }
    try {
      console.log("here is the dynamo insert");
      const token = Math.floor(100000 + Math.random() * 900000);
      var registrationItem = {
        id: uuidv4(),
        recipient: email,
        token: token,
        createdAt: Date.now(),
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        payload: {
          email: email,
          firstNaame: firstName,
          lastName: lastName,
          timestamp: Date.now(),
          expiresAt: Math.floor(Date.now() / 1000) + 86400, //add 1 Day
        },
      };

      const dynamoDbResult = await signupHelpers.upsertSignupUserToDynamoDb(
        registrationItem
      );
      if (dynamoDbResult) {
        return apiResponses.error_200({ message: "User added" }, event);
      } else {
        return apiResponses.error_200({ message: "User is not added" }, event);
      }
    } catch (err) {
      return apiResponses.error_400({ message: "Cannot add user" }, event);
    }
  } catch (err) {
    return apiResponses.error_400({ message: "error" }, event);
  }
};
