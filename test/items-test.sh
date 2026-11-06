#!/usr/bin/env bash
# cURL test script for the CDK tutorial Items API (API Gateway + Lambda + DynamoDB).
# Usage: ./items-api-test.sh https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
#        (or edit base_url below)

base_url="${1:-https://1it1333qfa.execute-api.us-east-2.amazonaws.com/prod/}"
base_url="${https://1it1333qfa.execute-api.us-east-2.amazonaws.com/prod//}"
api_url="https://1it1333qfa.execute-api.us-east-2.amazonaws.com/prod/items"

echo "=========================================="
echo " STARTING API TESTING"
echo " Target: $api_url"
echo "=========================================="


echo -e " "
echo "==========="
echo "Creating an Item"
echo "==========="
echo -e " "
# Capture the response so the item ID can be reused in later tests
CREATE_RESPONSE=$(curl -s -X POST $api_url -H "Content-Type: application/json" -d '{
    "name": "Buy oat milk",
    "description": "The fancy barista edition"
}')
echo "$CREATE_RESPONSE"

## retrieving item ID after creation
itemId=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo -e " "
echo "Found ID: $itemId"

if [ -z "$itemId" ]; then
    echo "Could not extract an item ID. Check the API URL and the Lambda logs."
    exit 1
fi

echo -e " "
echo "==========="
echo "Creating Multiple Items"
echo "==========="
echo -e " "

curl -X POST $api_url -H "Content-Type: application/json" -d '{
    "name": "Book flights",
    "description": "Dallas to Seattle in March"
}'

echo -e " "
curl -X POST $api_url -H "Content-Type: application/json" -d '{
    "name": "Renew passport",
    "description": "Appointment next month"
}'

echo -e " "
curl -X POST $api_url -H "Content-Type: application/json" -d '{
    "name": "Study for SAA-C03",
    "description": "Two practice exams this week"
}'

echo -e " "
curl -X POST $api_url -H "Content-Type: application/json" -d '{
    "name": "Deploy the CDK stack",
    "description": "Run cdk diff first"
}'

echo -e " "
echo "==========="
echo "Retrieving All Items"
echo "==========="
echo -e " "
# Get all items
curl -X GET $api_url

echo -e " "
echo "==========="
echo "Retrieving an Item by ID"
echo "==========="
echo -e " "
# Get an item by ID
curl -X GET $api_url/$itemId

echo -e " "
echo "==========="
echo "Updating an Item by ID"
echo "==========="
echo -e " "
# Update an item
curl -X PUT $api_url/$itemId -H "Content-Type: application/json" -d '{
    "name": "Buy oat milk",
    "description": "Done! Got the barista edition."
}'

echo -e " "
echo "==========="
echo "Confirming the Update"
echo "==========="
echo -e " "
curl -X GET $api_url/$itemId

echo -e " "
echo "==========="
echo "Deleting an Item by ID"
echo "==========="
echo -e " "
# Delete an item
curl -X DELETE $api_url/$itemId

echo -e " "
echo "==========="
echo "Confirming the Delete (expect 404)"
echo "==========="
echo -e " "
# Get the deleted item - should now be gone (expect 404)
curl -i -X GET $api_url/$itemId

echo -e " "
echo "=========================================="
echo " Testing Error Cases"
echo "=========================================="
echo -e " "
# Error cases (-i prints the HTTP status line so you can check each result):

echo "==========="
echo "Testing Unknown ID for Get (expect 404)"
echo "==========="
echo -e " "
curl -i -X GET $api_url/does-not-exist

echo -e " "
echo "==========="
echo "Testing Unknown ID for Update (expect 404)"
echo "==========="
echo -e " "
# Relies on the ConditionExpression in the TypeScript handler.
# The original Python handler would create the item and return 200 instead.
curl -i -X PUT $api_url/does-not-exist -H "Content-Type: application/json" -d '{
    "name": "Ghost item",
    "description": "This should not be created"
}'

echo -e " "
echo "==========="
echo "Testing Invalid JSON Body (expect 400)"
echo "==========="
echo -e " "
curl -i -X POST $api_url -H "Content-Type: application/json" -d '{ this is not json'

echo -e " "
echo "==========="
echo "Testing Unsupported Method (expect 403)"
echo "==========="
echo -e " "
# No PATCH route exists, so API Gateway rejects it before Lambda runs
curl -i -X PATCH $api_url/$itemId -H "Content-Type: application/json" -d '{
    "name": "Nope"
}'

echo -e " "
echo "=========================================="
echo " API TESTING COMPLETE"
echo "=========================================="