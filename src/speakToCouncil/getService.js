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
                "localAuth":validationResult.localAuth,
                "placeRepeat":validationResult.placeRepeat,
                "serviceRepeat":validationResult.serviceRepeat
            },
            "isValid":validationResult.isValid,
            "violatedSlot":validationResult.violatedSlot,
        };
    }
    
    return {
        "SessionAttributes": {
            "isCounty":validationResult.isCounty,
            "localAuth":validationResult.localAuth,
            "placeRepeat":validationResult.placeRepeat,
            "serviceRepeat":validationResult.serviceRepeat
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
async function validateService(service, place, placeRepeat, serviceRepeat, localCouncil) {
    console.log(`local council: ${localCouncil}`);

    let validationResult

    if(service===null){
        if (serviceRepeat == 0){
            validationResult = {
                "isValid": false,
                "violatedSlot": 'service',
                "messageContent": `Sorry. I didn't quite understand that. can you please try again or use a different key word`,
                "serviceRepeat": 1
            }
        } else {
            validationResult = {
                "isValid": true,
                "messageContent": `We couldn't understand what you were saying so we are transferring you now`
            }
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
            "messageContent": `You've asked for ${service}. I need some more information to be able to direct your call. for example, do you need ${altService}`
        }
        return buildValidationResult(validationResult);
    }

    if(JSON.parse(dbService).Items[0].isCounty == null) {
        if(serviceRepeat==0){
            validationResult = {
                "isValid": false,
                "violatedSlot": 'service',
                "messageContent": `Sorry. I didn't understand you, please try a different key word.`,
                "serviceRepeat": 1
            }
            
        } else {
            validationResult = {
                "isValid": true,
                "messageContent": `We couldn't understand what you were saying so we are transferring you now`
            }
        }
        
        return buildValidationResult(validationResult);
    }

    if(JSON.parse(dbService).Items[0].isCounty == true){
        validationResult = {
            "isValid": true,
            "isCounty": JSON.parse(dbService).Items[0].isCounty,
            "messageContent": "We are passing you to the county now"
        }
        return buildValidationResult(validationResult);
    }

    if(place === null && (localCouncil == null || localCouncil == "")){

        if(parseInt(placeRepeat) < 2){
            validationResult = {
                "isValid": false,
                "violatedSlot": 'northamptonshirePlaceSlot',
                "messageContent": 'So we can direct you to the right person please tell us where you live or where the issue you are reporting is located. For example the name of the town or village you are in',
                "placeRepeat": placeRepeat + 1
            }
        } else {
            validationResult = {
                "isValid": true,
                "messageContent": "We couldn't identify where you are so we are transferring you now"
            }
        }

        return buildValidationResult(validationResult);
    }

    if(localCouncil != null && localCouncil != "" && localCouncil != undefined){
        validationResult = {
            "isValid": true,
            "isCounty": JSON.parse(dbService).Items[0].isCounty,
            "localAuth": localCouncil.toUpperCase(),
            "messageContent": `The service is ${service} and the local authority is ${localCouncil.toUpperCase()}`
        }
        return buildValidationResult(validationResult);
    }

    var getPlace = await getCouncil.getPlace(place);

    validationResult = {
        "isValid": true,
        "isCounty": JSON.parse(dbService).Items[0].isCounty,
        "localAuth": JSON.parse(getPlace).Items[0].DistrictOrBorough,
        "messageContent": `The service is ${service} and the local authority is ${JSON.parse(getPlace).Items[0].DistrictOrBorough}`
    }

    return buildValidationResult(validationResult);
    
}

//async function as we have to wait for result from db before returning
module.exports = async function(intentRequest, callback) {
    var service = intentRequest.currentIntent.slots.service;
    var place = intentRequest.currentIntent.slots.northamptonshirePlaceSlot;
    var localCouncil;
    console.log(intentRequest.sessionAttributes);

    if(intentRequest.sessionAttributes.hasOwnProperty("northamptonPlaceName")){
        console.log("we've got the attribute");
        localCouncil = intentRequest.sessionAttributes.northamptonPlaceName;
    }
    if(intentRequest.sessionAttributes.hasOwnProperty("serviceRepeat")){
        var serviceRepeat = intentRequest.sessionAttributes.serviceRepeat;
    } else {
        var serviceRepeat = 0;
    }
    

    if(intentRequest.sessionAttributes.hasOwnProperty("placeRepeat")){
        var placeRepeat = intentRequest.sessionAttributes.placeRepeat;
    } else {
        var placeRepeat = 0;
    }

    console.log("service repeat = " + placeRepeat);

    
    const source = intentRequest.invocationSource;
    console.log(`the source is ${source}`);
    
    if(source === 'DialogCodeHook') {
        const slots = intentRequest.currentIntent.slots;
        console.log(intentRequest)
        // wait for validation result
        const validationResult = await validateService(service, place, placeRepeat, serviceRepeat, localCouncil);
        
        if(!validationResult.isValid) {
            slots[`${validationResult.violatedSlot}`] = null;
            callback(lexResponses.elicitSlot(validationResult.SessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
        //callback(lexResponses.delegate(validationResult.SessionAttributes, intentRequest.currentIntent.slots));
        callback(lexResponses.closeSlot(validationResult.SessionAttributes,validationResult.message));
        return;
    }
}

