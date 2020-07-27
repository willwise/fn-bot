'use strict'

var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});

exports.createSingleItem = (event, context, callback) => {
    createItem(event.body.serviceName, event.body.isCounty, callback);
}

function createItem(serviceName, isCounty, callback) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var tableName = process.env.TABLE_NAME;
    console.log("table name: "+tableName);

    var params = {
        TableName: tableName,
        Item: {
            "ServiceName": serviceName.toLowerCase(),
            "isCounty": isCounty.toLowerCase()
        }
    };

    docClient.put(params, function(err, data){
        if(err){
            callback(err, null) 
        } else {
             var res = {
                "statusCode": 200,
                "body": JSON.stringify(data),
                headers: {"Access-Control-Allow-Origin": "*"},
                "isBase64Encoded": false
             }
        }
    })
}