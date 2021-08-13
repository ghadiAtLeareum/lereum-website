import * as AWS from "aws-sdk";
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

export const checkEmailExisted = async (email: string) => {
  var params = {
    UserPoolId: "us-east-1_mBCeFqdZr",
    Filter: `email = \"${email}\"`,
  };
  console.log(params);
  var data = await cognitoidentityserviceprovider.listUsers(params).promise();
  if (data.Users.length > 0) {
    return true
  } else {
    return false
  }
};
