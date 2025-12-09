import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as location from "aws-cdk-lib/aws-location";

import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import { RemovalPolicy, Duration } from "aws-cdk-lib";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
     * 🧱 1️⃣ DynamoDB Tables
     */
    const listingsTable = new dynamodb.Table(this, "ListingsTable", {
      tableName: "BoardingHouseListings",
      partitionKey: { name: "listingId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userProfilesTable = new dynamodb.Table(this, "UserProfilesTable", {
      tableName: "UserProfiles",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const otpTable = new dynamodb.Table(this, "OTPVerifications", {
      tableName: "OTPVerifications",
      partitionKey: {
        name: "phoneNumber",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl", // Auto-delete expired OTPs after 5 minutes
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const favoritesTable = new dynamodb.Table(this, "FavoritesTable", {
      tableName: "UserFavorites",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "listingId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const supportRequestsTable = new dynamodb.Table(
      this,
      "SupportRequestsTable",
      {
        tableName: "SupportRequests",
        partitionKey: {
          name: "requestId",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const notificationsTable = new dynamodb.Table(this, "NotificationsTable", {
      tableName: "Notifications",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "notificationId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /*
     * ☁️ 2️⃣ S3 Bucket (for room images)
     */
    const imagesBucket = new s3.Bucket(this, "BoardingHouseImages", {
      bucketName: `findnest-images-${cdk.Aws.ACCOUNT_ID}`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
    });

    /*
     * 🔐 3️⃣ Cognito UserPool (Users & Admins with Groups)
     * - Users: Login with Phone + OTP (passwordless with random backend password)
     * - Admins: Login with Username + Password
     */
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "FindNestUsers",
      selfSignUpEnabled: false, // Backend will create users
      signInAliases: {
        phone: true, // Users login with phone
        username: true, // Admins login with username
      },
      autoVerify: { phone: true },
      standardAttributes: {
        email: { required: false, mutable: true },
        phoneNumber: { required: false, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient("UserPoolClient", {
      authFlows: {
        userPassword: true, // For admin login
        adminUserPassword: true, // For backend to authenticate users
        custom: true, // For custom auth flows if needed
      },
    });

    // Create "Users" Group
    const usersGroup = new cognito.CfnUserPoolGroup(this, "UsersGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "Users",
      description: "Regular users who login with phone + OTP",
    });

    // Create "Landlords" Group
    const landlordsGroup = new cognito.CfnUserPoolGroup(
      this,
      "LandlordsGroup",
      {
        userPoolId: userPool.userPoolId,
        groupName: "Landlords",
        description: "Landlords who can create and manage listings",
      }
    );

    // Create "Admins" Group with elevated permissions
    const adminsGroup = new cognito.CfnUserPoolGroup(this, "AdminsGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "Admins",
      description: "Administrators who login with username + password",
    });

    /*
     * 🗺️ 3️⃣ Amazon Location Service
     */
    const placeIndex = new location.CfnPlaceIndex(this, "PlaceIndex", {
      indexName: `FindNestPlacesV3-${cdk.Aws.ACCOUNT_ID}`,
      dataSource: "Here", // Better POI coverage for Asia (Vietnam)
      dataSourceConfiguration: {
        intendedUse: "Storage", // Allows storing and querying POI data
      },
    });

    const map = new location.CfnMap(this, "Map", {
      mapName: `FindNestMap-${cdk.Aws.ACCOUNT_ID}`,
      configuration: { style: "VectorEsriStreets" },
    });

    const routeCalculator = new location.CfnRouteCalculator(
      this,
      "RouteCalculator",
      {
        calculatorName: `FindNestRoutesV3-${cdk.Aws.ACCOUNT_ID}`,
        dataSource: "Here",
      }
    );

    /*
     * 🔐 4️⃣ Cognito Identity Pool (for frontend map access)
     */
    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      identityPoolName: "FindNestMapAccess",
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // IAM Role for unauthenticated users (map access only)
    const unauthenticatedRole = new iam.Role(this, "UnauthenticatedRole", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "unauthenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      inlinePolicies: {
        LocationServicePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "geo:GetMap*",
                "geo:SearchPlaceIndexForText",
                "geo:SearchPlaceIndexForPosition", 
                "geo:GetPlace",
                "geo:CalculateRoute",
                "geo:CalculateRouteMatrix"
              ],
              resources: [
                map.attrArn,
                placeIndex.attrArn,
                routeCalculator.attrArn,
              ],
            }),
          ],
        }),
      },
    });

    // IAM Role for authenticated users (full access)
    const authenticatedRole = new iam.Role(this, "AuthenticatedRole", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      inlinePolicies: {
        LocationServicePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "geo:GetMap*",
                "geo:SearchPlaceIndexForText",
                "geo:SearchPlaceIndexForPosition",
                "geo:GetPlace",
                "geo:CalculateRoute",
                "geo:CalculateRouteMatrix",
                "geo:BatchGetDevicePosition",
                "geo:GetDevicePosition"
              ],
              resources: [
                map.attrArn,
                placeIndex.attrArn,
                routeCalculator.attrArn,
              ],
            }),
          ],
        }),
      },
    });

    // Attach roles to identity pool
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "IdentityPoolRoleAttachment",
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: authenticatedRole.roleArn,
          unauthenticated: unauthenticatedRole.roleArn,
        },
      }
    );

    /*
     * 📊 5️⃣ CloudWatch Monitoring
     */
    const logGroup = new logs.LogGroup(this, "ApiLogGroup", {
      logGroupName: `/aws/lambda/FindNestApi`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /*
     * ⚙️ 6️⃣ Lambda Function (Backend API)
     */
    const apiLambda = new lambda.Function(this, "ApiLambda", {
      functionName: "FindNestApi",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../../backend/src/lambda")
      ),
      timeout: cdk.Duration.seconds(30),
      logGroup: logGroup,
      environment: {
        LISTINGS_TABLE_NAME: listingsTable.tableName,
        USER_PROFILES_TABLE_NAME: userProfilesTable.tableName,
        OTP_TABLE_NAME: otpTable.tableName,
        FAVORITES_TABLE_NAME: favoritesTable.tableName,
        SUPPORT_REQUESTS_TABLE_NAME: supportRequestsTable.tableName,
        NOTIFICATIONS_TABLE_NAME: notificationsTable.tableName,
        IMAGES_BUCKET_NAME: imagesBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        PLACE_INDEX_NAME: placeIndex.indexName,
        MAP_NAME: map.mapName,
        ROUTE_CALCULATOR_NAME: routeCalculator.calculatorName,
        BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
        REGION: cdk.Aws.REGION,
      },
    });

    listingsTable.grantReadWriteData(apiLambda);
    userProfilesTable.grantReadWriteData(apiLambda);
    otpTable.grantReadWriteData(apiLambda);
    favoritesTable.grantReadWriteData(apiLambda);
    supportRequestsTable.grantReadWriteData(apiLambda);
    notificationsTable.grantReadWriteData(apiLambda);
    imagesBucket.grantReadWrite(apiLambda);

    // Grant Cognito permissions for user management and authentication
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminListGroupsForUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminEnableUser",
          "cognito-idp:AdminDisableUser",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:ListUsers",
          "cognito-idp:GlobalSignOut",
        ],
        resources: [userPool.userPoolArn],
      })
    );

    // Grant SNS permissions for sending SMS (OTP + notifications)
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        resources: ["*"],
      })
    );

    // Grant Amazon Bedrock permissions for AI recommendations
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*"],
      })
    );

    // Grant CloudWatch Logs permissions for admin monitoring
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["logs:FilterLogEvents"],
        resources: [
          `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/FindNestApi*`,
        ],
      })
    );

    // Grant Amazon Location Service permissions
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "geo:SearchPlaceIndexForText",
          "geo:GetPlace",
          "geo:CalculateRoute",
          "geo:SearchPlaceIndexForPosition",
        ],
        resources: [placeIndex.attrArn, routeCalculator.attrArn],
      })
    );

    /*
     * 🌐 7️⃣ API Gateway (REST API)
     */
    const api = new apigateway.LambdaRestApi(this, "BoardingHouseApi", {
      handler: apiLambda,
      proxy: true,
      deployOptions: {
        stageName: "prod",
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
      // Ensure no API key required
      restApiName: "FindNestAPI",
      description: "FindNest Backend API",
    });

    /*
     * 📤 8️⃣ Outputs (for FE / Amplify config)
     */
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway endpoint URL",
    });
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });
    new cdk.CfnOutput(this, "Region", {
      value: cdk.Aws.REGION,
      description: "AWS Region",
    });
    new cdk.CfnOutput(this, "ImagesBucket", {
      value: imagesBucket.bucketName,
      description: "S3 Bucket for images",
    });
    new cdk.CfnOutput(this, "PlaceIndexName", {
      value: placeIndex.indexName,
      description: "Amazon Location Place Index",
    });
    new cdk.CfnOutput(this, "MapName", {
      value: map.mapName,
      description: "Amazon Location Map",
    });
    new cdk.CfnOutput(this, "RouteCalculatorName", {
      value: routeCalculator.calculatorName,
      description: "Amazon Location Route Calculator",
    });
    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: identityPool.ref,
      description: "Cognito Identity Pool ID for frontend map access",
    });
  }
}
