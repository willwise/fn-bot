'use strict';

const lexResponses = require('./lexResponses');
const getIsCounty = require('./getIsCounty');
const getLocation = require('./getLocation');

const services = ['street doctor','council tax','benefits','record office'];

function buildValidationResult(validationResult){
    if(validationResult.messageContent == null){
        return {
            "SessionAttributes": {
                "isCounty":validationResult.isCounty,
                "localAuth":validationResult.localAuth
            },
            "isValid":validationResult.isValid,
            "violatedSlot":validationResult.violatedSlot,
        };
    }
    
    return {
        "SessionAttributes": {
            "isCounty":validationResult.isCounty,
            "localAuth":validationResult.localAuth
        },
        "isValid":validationResult.isValid,
        "violatedSlot":validationResult.violatedSlot,
        message: {
            contentType: 'PlainText',
            content: validationResult.messageContent
        },
    };
}

//async function as we have to wait for result from db before returning
async function validateService(service, postcode) {
    if(service===null){
        return buildValidationResult(false, 'service', `This service doesn't exist`)
    }
    //get item from database to figure whether or not it's a county service
    var dbService = await getIsCounty.isCounty(service);
    console.log(JSON.parse(dbService).Items[0].isCounty);

    let validationResult

    if(JSON.parse(dbService).Items[0].isCounty = null) {
        validationResult = {
            "isValid": false,
            "violatedSlot": 'service',
            "messageContent": `The service ${service} doesn't exist`
        }
        return buildValidationResult(validationResult);
    }

    if(JSON.parse(dbService).Items[0].isCounty == true){
        validationResult = {
            "isValid": true,
            "isCounty": JSON.parse(dbService).Items[0].isCounty
        }
        return buildValidationResult(validationResult);
    }

    if(postcode == null){
        validationResult = {
            "isValid": false,
            "violatedSlot": 'postcode',
            "messageContent": 'What is your postcode'
        }
        return buildValidationResult(validationResult);
    }

    var address = await getLocation(postcode, 'mGvGWUtOi5aRYpACv6PyiofCOPkNOhPG');
    console.log(address.data);

    if(address.response != undefined){
        if(address.response.status == 400){
            validationResult = {
                "isValid": false,
                "isCounty": JSON.parse(dbService).Items[0].isCounty,
                "violatedSlot": 'postcode',
                "messageContent": 'Please could you repeat your postcode'
            }
            return buildValidationResult(validationResult);
        }
    }
    
    if(address.data.hasOwnProperty('results') == false){
        validationResult = {
            "isValid": false,
            "isCounty": JSON.parse(dbService).Items[0].isCounty,
            "violatedSlot": 'postcode',
            "messageContent": 'Please could you repeat your postcode'
        }
        return buildValidationResult(validationResult);
    }

    validationResult = {
        "isValid": true,
        "isCounty": JSON.parse(dbService).Items[0].isCounty,
        "localAuth": address.data.results[0].DPA.LOCAL_CUSTODIAN_CODE_DESCRIPTION
    }

    console.log(address.data.results[0].DPA.LOCAL_CUSTODIAN_CODE_DESCRIPTION);
    return buildValidationResult(validationResult);
    
}

//async function as we have to wait for result from db before returning
module.exports = async function(intentRequest, callback) {
    var service = intentRequest.currentIntent.slots.service;
    var postcode = intentRequest.currentIntent.slots.postcode;
    
    console.log(intentRequest.currentIntent.slots);
    
    const source = intentRequest.invocationSource;
    console.log(`the source is ${source}`);
    
    if(source === 'DialogCodeHook') {
        const slots = intentRequest.currentIntent.slots;
        // wait for validation result
        const validationResult = await validateService(service, postcode);
        //console.log(validationResult.SessionAttributes);
        //console.log(validationResult.isValid);
        
        if(!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(lexResponses.elicitSlot(validationResult.SessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
        callback(lexResponses.delegate(validationResult.SessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
};