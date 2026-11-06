import {randomUUID} from 'crypto';
import type {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {ConditionalCheckFailedException, DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand, DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME;
if (!TABLE_NAME) {
  throw new Error('TABLE_NAME environment variable is not set');
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface ItemInput {
  id: string;
  name?: string;
  description?: string;
  price?: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const {httpMethod, resource} = event;
    const id = event.pathParameters?.id;

    try {
        if (httpMethod === 'GET' && resource === '/items') {
            return await getAllItems();
        }
        if (httpMethod === 'POST' && resource === '/items') {
            return await createItem(parseBody(event));
        }
        if(resource === '/items/{id}') {
            if (httpMethod === 'GET') {
                return await getItem(id!);
            }
            if (httpMethod === 'PUT') {
                return await updateItem(id!, parseBody(event));
            }
            if (httpMethod === 'DELETE') {
                return await deleteItem(id!);
            }
        } return {
            statusCode: 400,
            body: JSON.stringify({message: 'Invalid request'}),
        };
        
    }catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Internal server error'}),
        };
    }
};

function parseBody(event: APIGatewayProxyEvent): ItemInput {
    return JSON.parse(event.body ?? '{}') as ItemInput;
}

async function getAllItems(): Promise<APIGatewayProxyResult> {
    const result = await ddb.send(new ScanCommand({TableName: TABLE_NAME}));
    return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
    };
}

async function getItem(id: string): Promise<APIGatewayProxyResult> {
    const result = await ddb.send(new GetCommand({TableName: TABLE_NAME, Key: {id}}));
    if (!result.Item) {
        return {
            statusCode: 404,
            body: JSON.stringify({message: 'Item not found'}),
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
    };
}

async function createItem(body: ItemInput): Promise<APIGatewayProxyResult> {
    const item = {
        id: randomUUID(),
        name: body.name ?? '',
        description: body.description ?? '',
        price: body.price ?? 0,
    };
    await ddb.send(new PutCommand({TableName: TABLE_NAME, Item: item}));
    return {
        statusCode: 201,
        body: JSON.stringify(item),
    };
}

async function updateItem(id: string, body: ItemInput): Promise<APIGatewayProxyResult> {
    try{
        const result = await ddb.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {id},
            UpdateExpression: 'SET #name = :name, #description = :description, #price = :price',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#description': 'description',
                '#price': 'price',
            },
            ExpressionAttributeValues: {
                ':name': body.name ?? '',
                ':description': body.description ?? '',
                ':price': body.price ?? 0,
            },
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_NEW',
        }));
        return {
            statusCode: 200,
            body: JSON.stringify(result.Attributes),
        };
    }catch (error) {
        if (error instanceof ConditionalCheckFailedException) {
            return {
                statusCode: 404,
                body: JSON.stringify({message: 'Item not found'}),
            };
        }
        throw error;
    }
}

async function deleteItem(id: string): Promise<APIGatewayProxyResult> {
    await ddb.send(new DeleteCommand({TableName: TABLE_NAME, Key: {id}}));
    return {
        statusCode: 204,
        body: `Deleted item with id ${id}`,
    };
}

function response(statusCode: number, body: any): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
}