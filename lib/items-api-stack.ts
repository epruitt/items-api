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

  }
}
