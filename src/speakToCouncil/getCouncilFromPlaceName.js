'use strict';

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'eu-west-2'});
const tableName = process.env.PLACE_TABLE_NAME

module.exports.getPlace = async function(place){
    let params = {
        TableName: tableName,
        KeyConditionExpression: "#name = :place",
        ExpressionAttributeNames: {
            "#name": "PlaceName"
        },
        ExpressionAttributeValues: {
            ":place": place.toLowerCase()
        }
    };

    let dbresult = await docClient.query(params).promise();

    console.log(JSON.stringify(dbresult));
    return JSON.stringify(dbresult);

};