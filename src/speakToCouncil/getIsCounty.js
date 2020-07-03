'use strict';

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'eu-west-2'});

module.exports.isCounty = async function(service){
    let params = {
        TableName: "FNBotServices",
        KeyConditionExpression: "#name = :service",
        ExpressionAttributeNames: {
            "#name": "ServiceName"
        },
        ExpressionAttributeValues: {
            ":service": service.toLowerCase()
        }
    };

    let dbresult = await docClient.query(params).promise();

    console.log(JSON.stringify(dbresult));
    return JSON.stringify(dbresult);

};