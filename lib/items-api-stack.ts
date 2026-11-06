import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ItemsApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Dynamodb Table
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'ItemsTable',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    // output the table name as a CloudFormation output
    new cdk.CfnOutput(this, 'ItemsTableName', {
      value: itemsTable.tableName,
      exportName: 'ItemsTableName',
    });

    // Lambda function
    const apiHandler = new nodejs.NodejsFunction(this, 'ApiHandler', {
      entry: path.join(__dirname, '../lambda/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: itemsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    //Permissions
    itemsTable.grantReadWriteData(apiHandler);

    // API Gateway
    const api = new apigateway.RestApi(this, 'ItemsApi', {
      restApiName: 'Items Service',
      description: 'CRUD API for items, built with AWS CDK, Lambda, and DynamoDB',
    });

    //forward all requests to the Lambda function
    const integration = new apigateway.LambdaIntegration(apiHandler);

    //routes
    const items = api.root.addResource('items');
    items.addMethod('GET', integration); // GET /items
    items.addMethod('POST', integration); // POST /items

    const item = items.addResource('{id}');
    item.addMethod('GET', integration); // GET /items/{id}
    item.addMethod('PUT', integration); // PUT /items/{id}
    item.addMethod('DELETE', integration); // DELETE /items/{id}

    //output the API endpoint as a CloudFormation output
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      exportName: 'ApiEndpoint',
    });

  }
}
