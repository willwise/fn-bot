'use strict'

const csv = require('csvtojson');
var AWS = require("aws-sdk");
AWS.config.update({region:"eu-west-2"});

exports.bulkUpload = async(event, context, callback) => {
    var fileName = 'data/northamptonshire-places.csv'
    var bucket = process.env.BUCKET
    var jsonServices = await getCsv(bucket, fileName);
    jsonServices.forEach(element => {
        createItem(element)
    });
    callback(null,);
}

function createItem(element) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var tableName = process.env.TABLE_NAME;

    var params = {
        TableName: tableName,
        Item: {
            "PlaceName": element.PlaceName.toLowerCase(),
            "DistrictOrBorough": element.LocalAuthority.toUpperCase()
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