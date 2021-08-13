import apiResponses from "../helpers/apiResponses";
import { APIGatewayProxyHandler } from "aws-lambda";
import { SignupHelpers } from "../helpers/signupHelpers";
const signupHelpers = new SignupHelpers();
import "source-map-support/register";

export const handler: APIGatewayProxyHandler = async (event) => {
  let body = JSON.parse(event.body);
  let { recaptchaToken, agreement, email } = body;
  console.log(event);
  if (!recaptchaToken) {
    return apiResponses._400({ message: "missing text fom the body" });
  }
  if (!agreement) {
    return apiResponses._400({ message: "missing agreement from the body" });
  }

  if (!email) {
    return apiResponses._400({ message: "missing email from the body" });
  }

  var recaptchaResult = await signupHelpers.verifyRecaptcha(body.recaptchaToken);
  console.log(recaptchaResult);
  if (!recaptchaResult) {
    console.log(recaptchaResult);
  }

  try {
    let cognitoCheckUserResult = await signupHelpers.checkEmailExisted(body.email);
    if (cognitoCheckUserResult) {
      //for security reasons we return 200 if email is found
      return apiResponses._200({ message: "you can not use this email" });
    }
  } catch (err) {
    return apiResponses._400({ message: "you can use this email" });
  }
};
