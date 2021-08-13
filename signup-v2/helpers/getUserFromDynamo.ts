import { environment } from "../environment";
import * as AWS from "aws-sdk";
const documentClient = new AWS.DynamoDB.DocumentClient();
import * as _dynamodbAutoMarshaller from "@aws/dynamodb-auto-marshaller";
const marshaller = new _dynamodbAutoMarshaller.Marshaller();

export const getUserFromDynamo = async (email: string) => {
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
