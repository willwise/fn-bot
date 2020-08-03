'use strict'

const csv = require('csvtojson');
var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});

exports.bulkUpload = async(event, context, callback) => {
    var fileName = 'data/Services-plus queries-NCC (2).csv'
    var bucket = process.env.BUCKET
    var jsonServices = await getCsv(bucket, fileName); //can probably make these params
    jsonServices.forEach(element => {
        //createItem(element.serviceName, element.isCounty, element.synonym)
        createItem(element)
    });
    callback(null,);
}

function createItem(element) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var tableName = process.env.TABLE_NAME;
    var boolIsCounty;
    var boolIsBoth;
    if (element.isCounty.toLowerCase() == 'true'){
        boolIsCounty = true;
    } else {
        boolIsCounty = false;
    }
    if(element.isBoth.toLowerCase() == 'true'){
        boolIsBoth = true;
    } else {
        boolIsBoth = false;
    }

    var params = {
        TableName: tableName,
        Item: {
            "ServiceName": element.serviceName.toLowerCase(),
            "isCounty": boolIsCounty,
            //"Synonyms": element.synonyms.toLowerCase(),
            "isBoth": boolIsBoth,
            //"alternativeServices": element.alternativeServices.toLowerCase()
            "LocalGovernmentServiceListId": element.LocalGovernmentServiceListId
        }
    };
    if(element.synonym){
        params.Item["Synonyms"] = element.synonym.toLowerCase()
    }
    if(element.AlternativeServices){
        params.Item["alternativeServies"] = element.AlternativeServices.toLowerCase()
    }

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