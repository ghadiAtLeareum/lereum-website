import apiResponses from "../helpers/apiResponses";
import { APIGatewayProxyHandler } from "aws-lambda";
import { SignupHelpers } from "../helpers/signupHelpers";
const signupHelpers = new SignupHelpers();
import "source-map-support/register";
import { v4 as uuidv4 } from "uuid";

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body);
  const email = body.email;
  const recaptchaToken = body.recaptchaToken;
  const agreement = body.agreement;
  const firstName = body.firstName;
  const lastName = body.lastName;
  console.log(event);

  // try {
  //   if (!recaptchaToken) {
  //     return apiResponses._400({ message: "missing text fom the body" });
  //   }
  //   if (!agreement) {
  //     return apiResponses._400({ message: "missing agreement from the body" });
  //   }

  //   if (!email) {
  //     return apiResponses._400({ message: "missing email from the body" });
  //   }

  //   var recaptchaResult = await signupHelpers.verifyRecaptcha(recaptchaToken);
  //   console.log("here is the recaptcha check");
  //   if (!recaptchaResult) {
  //     return apiResponses._400({ message: "Recaptcha not verified" });
  //   } else {
  //     console.log("recaptcha verified");
  //   }

  //   let cognitoCheckUserResult = await signupHelpers.checkEmailExisted(
  //     body.email
  //   );

  //   try {
  //     console.log("here is the cognito check");
  //     if (cognitoCheckUserResult) {
  //       //for security reasons we return 200 if email is found
  //       return apiResponses._200({ message: "you can not use this email" });
  //     }
  //   } catch (err) {
  //     return apiResponses._400({ message: "This email is valid" });
  //   }

    try {
      console.log("here is the dynamo insert");
      const token = Math.floor(100000 + Math.random() * 900000);
      var registrationItem = {
       id:uuidv4(),
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
       }
     };
      const dynamoDbResult = await signupHelpers.upsertSignupUserToDynamoDb(registrationItem);
      if (dynamoDbResult) {
        return apiResponses._200({ message: "User added" });
      }
    } catch (err) {
      return apiResponses._400({ message: "Cannot add user" });
    }
  // } catch (err) {
  //   console.log("Error:", err);
  //   return apiResponses._400({ message: "error" });
  // }
};
