import * as AWS from "aws-sdk";
const documentClient = new AWS.DynamoDB.DocumentClient();
import * as _dynamodbAutoMarshaller from "@aws/dynamodb-auto-marshaller";


export const upsertSignupUserToDynamoDb = async () => {
    var tableName = "verification";
    documentClient.put(
        {
            TableName: tableName,
            Item: {
                id: {
                    S: "2",
                },
                recipient: {
                    S: "mdallalghadi@gmail.com",
                },
                type: {
                    S: "SIGN_UP_EMAIL",
                },
                token: {
                    S: "difhosdahfodishf;odsi",
                },
                created_at: {
                    S: "21-2-2020",
                },
                ttl: {
                    S: "21-3-2020",
                },
                payload: {
                    M: {
                        userId: { S: "12" },
                        firstName: { S: "ghadi" },
                        lastName: { S: "mdallal" },
                        email: { S: "ghadi@gmail.com" },
                        createdAt: { S: "20-20-20" },
                    },
                },
            },
        },
        function (err, data) {
            if (err) {
                return err
            } else {
                console.log( JSON.stringify(data, null, "  "))
            }
        }
    );
}
