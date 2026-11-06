import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
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

  }
}
