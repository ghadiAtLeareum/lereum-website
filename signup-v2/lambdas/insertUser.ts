import apiResponses from "../helpers/apiResponses";
import { APIGatewayProxyHandler } from "aws-lambda";
import { upsertSignupUserToDynamoDb } from "../helpers/upsertSignupUserToDynamoDb";

export const handler: APIGatewayProxyHandler = async (event): Promise<any> => {
  const body = JSON.parse(event.body);

  try {
    var result = await upsertSignupUserToDynamoDb();
  } catch (err) {
    console.log("Error:", err);
    return apiResponses._400({ message: "error" });
  }
    
};
