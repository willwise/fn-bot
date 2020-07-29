'use strict';

const lexResponses = require('./lexResponses');
const getIsCounty = require('./getIsCounty');
const getLocation = require('./getLocation');
const osAPIKey = process.env.OS_API_KEY
const getCouncil = require('./getCouncilFromPlaceName');

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
async function validateService(service, place) {

    let validationResult

    if(service===null){
        validationResult = {
            "isValid": false,
            "violatedSlot": 'service',
            "messageContent": `This service doesn't exist`
        }
        return buildValidationResult(validationResult)
    }
    //get item from database to figure whether or not it's a county service
    var dbService = await getIsCounty.isCounty(service);
    console.log(JSON.parse(dbService).Items[0].isCounty);



    if(JSON.parse(dbService).Items[0].isBoth === true){
        console.log(JSON.parse(dbService).Items[0].alternativeServies);
        var altServicesArray = JSON.parse(dbService).Items[0].alternativeServies.split(',')
        var altService

        for (let i = 0; i < altServicesArray.length; i++) {
            if(i===0){
                altService = altServicesArray[i];
            } else {
                altService += " or ";
                altService += altServicesArray[i];
            }   
        }

        validationResult = {
            isValid: false,
            "violatedSlot": 'service',
            "messageContent": `You've asked for ${service} we need some more information to be able to direct your call. Please tell us if you need for example. ${altService}`
        }
        return buildValidationResult(validationResult);
    }

    if(JSON.parse(dbService).Items[0].isCounty == null) {
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

    if(place == null){
        validationResult = {
            "isValid": false,
            "violatedSlot": 'northamptonshirePlaceSlot',
            "messageContent": 'So we can direct you to the right person please tell us where you live or where the issue you are reporting is located. For example the name of the town or village you are in'
        }
        return buildValidationResult(validationResult);
    }

    var getPlace = await getCouncil.getPlace(place);

    validationResult = {
        "isValid": true,
        "isCounty": JSON.parse(dbService).Items[0].isCounty,
        "localAuth": JSON.parse(getPlace).Items[0].DistrictOrBorough
    }

    return buildValidationResult(validationResult);
    
}

//async function as we have to wait for result from db before returning
module.exports = async function(intentRequest, callback) {
    var service = intentRequest.currentIntent.slots.service;
    var place = intentRequest.currentIntent.slots.northamptonshirePlaceSlot;
    
    console.log(intentRequest.currentIntent.slots);
    
    const source = intentRequest.invocationSource;
    console.log(`the source is ${source}`);
    
    if(source === 'DialogCodeHook') {
        const slots = intentRequest.currentIntent.slots;
        // wait for validation result
        const validationResult = await validateService(service, place);
        
        if(!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(lexResponses.elicitSlot(validationResult.SessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
        callback(lexResponses.delegate(validationResult.SessionAttributes, intentRequest.currentIntent.slots));
        return;
    }
};
