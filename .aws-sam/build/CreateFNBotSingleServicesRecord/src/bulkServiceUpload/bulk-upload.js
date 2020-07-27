'use strict'

const csv = require('csvtojson');
var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});

exports.bulkUpload = async(event, context, callback) => {
    var fileName = 'data/Services-plus queries-NCC (2).csv'
    var bucket = process.env.BUCKET
    var jsonServices = await getCsv(bucket, fileName); //can probably make these params
    jsonServices.forEach(element => {
        createItem(element.serviceName, element.isCounty, element.synonym)
    });
    callback(null,);
}

function createItem(serviceName, isCounty, synonyms) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var tableName = process.env.TABLE_NAME;
    var boolIsCounty;
    if (isCounty == 'true'){
        boolIsCounty = true;
    } else {
        boolIsCounty = false;
    }

    var params = {
        TableName: tableName,
        Item: {
            "ServiceName": serviceName.toLowerCase(),
            "isCounty": boolIsCounty,
            "Synonyms": synonyms.toLowerCase()
        }
    };

    docClient.put(params, function(err, data){
        if(err){
            console.log(err);
        } else {
             var res = {
                "statusCode": 200,
                "body": JSON.stringify(data),
                headers: {"Access-Control-Allow-Origin": "*"},
                "isBase64Encoded": false
             };

            console.log(res);
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
    return json
}