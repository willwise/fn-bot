'use strict'

var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});

exports.createSingleItem = (event, context, callback) => {
    createItem(event.body.serviceName, event.body.isCounty, callback);
}

function createItem(element, callback) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var tableName = process.env.TABLE_NAME;
    var boolIsCounty;
    var boolIsBoth;
    if (element.isCounty == 'true'){
        boolIsCounty = true;
    } else {
        boolIsCounty = false;
    }
    if(element.isBoth == 'true'){
        boolIsBoth = true;
    } else {
        boolIsBoth = false;
    }

    var params = {
        TableName: tableName,
        Item: {
            "ServiceName": element.serviceName.toLowerCase(),
            "isCounty": boolIsCounty,
            "Synonyms": element.synonyms.toLowerCase(),
            "isBoth": boolIsBoth,
            "alternativeServices": element.alternativeServices.toLowerCase(),
            "LocalGovernmentServiceListId": element.LocalGovernmentServiceListId
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