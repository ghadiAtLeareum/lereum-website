import apiResponses from "../helpers/apiResponses";
import { APIGatewayProxyHandler } from "aws-lambda";
import { getUserFromDynamo } from "../helpers/getUserFromDynamo";

export const handler: APIGatewayProxyHandler = async (event): Promise<any> => {
  const body = JSON.parse(event.body);
  const { email } = body;
  //console.log(event);
  if (!email) {
    return apiResponses._400({ message: "missing email fom the body" });
  }
  try {
    var result = await getUserFromDynamo(email);
  } catch (err) {
    console.log("Error:", err);
    return apiResponses._400({ message: "error" });
  }
  if (result) {
    return apiResponses._400({ message: "Email Already" });
  }
};
