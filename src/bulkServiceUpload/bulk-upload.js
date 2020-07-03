'use strict'

const csv = require('csvtojson');
var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});

exports.bulkUpload = async(event, context, callback) => {
    var jsonServices = getCsv('service-data','data/Services-plus queries-NCC (2).csv'); //can probably make these params
    jsonServices.forEach(element => {
        console.log(element.service);
        
    });
}

function createItem(serviceName, isCounty, callback) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var tableName = "FNBotServices"

    var params = {
        TableName: tableName,
        Item: {
            "ServiceName": serviceName.toLowerCase(),
            "isCounty": {"BOOL": isCounty.toLowerCase()}
        }
    };

    docClient.put(params, function(err, data){
        if(err){
            callback(err, null);
        } else {
             var res = {
                "statusCode": 200,
                "body": JSON.stringify(data),
                headers: {"Access-Control-Allow-Origin": "*"},
                "isBase64Encoded": false
             };
        }
    });
}

async function getCsv(s3Bucket, s3Key){
    var s3 = new AWS.S3();
    let params = {
        Bucket: s3Bucket,
        Key: s3Key
    };

    const stream = s3.getObject(params).createReadStream();
    const json = await csv().fromStream(stream);
    console.log(json);
}