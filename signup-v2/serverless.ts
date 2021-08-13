import type { AWS } from "@serverless/typescript";


const serverlessConfiguration: AWS = {
  service: "signup-v2",
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
  },
  plugins: ["serverless-webpack"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    },
    lambdaHashingVersion: "20201221",
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:*"],
        Resource:
          "arn:aws:lambda:us-east-1:873064552661:function:signup-v2-dev-signupMainLambda",
      },
      {
        Effect: "Allow",
        Action: [
          "cognito-idp:DescribeUserPool",
          "cognito-idp:CreateUserPoolClient",
          "cognito-idp:DeleteUserPoolClient",
          "cognito-idp:DescribeUserPoolClient",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminUserGlobalSignOut",
          "cognito-idp:ListUserPoolClients",
          "cognito-identity:DescribeIdentityPool",
          "cognito-identity:UpdateIdentityPool",
          "cognito-identity:SetIdentityPoolRoles",
          "cognito-identity:GetIdentityPoolRoles",
        ],
        Resource:
          "arn:aws:lambda:us-east-1:873064552661:function:signup-v2-dev-signupMainLambda",
      },
    ],
  },
  // import the function via paths
  functions: {
    //second function
    signupMainLambda: {
      handler: "./lambdas/signupMainLambda.handler",
      events: [
        {
          http: {
            path: "signup",
            method: "POST",
            cors: true,
          },
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
