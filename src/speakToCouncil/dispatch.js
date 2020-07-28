'use strict';

const getService = require('./getService');

module.exports = function(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const intentName = intentRequest.currentIntent.name;
    //const envIntentName = process.env.INTENT_NAME

   // if (intentName === envIntentName){
    //    console.log(intentName + ' was called');
        return getService(intentRequest, callback);
   // }

    throw new Error(`intent with name ${intentName} not supported`);
};