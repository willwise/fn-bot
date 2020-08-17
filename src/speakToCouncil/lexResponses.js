'use strict';

module.exports.delegate = function(sessionAttributes, slots, message) {
    return{
        sessionAttributes,
        dialogAction:{
            type: 'Delegate',
            slots,
            message
        },
    };
};

module.exports.elicitSlot = function(sessionAttributes, intentName, slots, slotToElicit, message, title, imageUrl, buttons) {
  return {
    sessionAttributes,
    dialogAction: {
      type: 'ElicitSlot',
      intentName,
      slots,
      slotToElicit,
      message
    }
  };
};

module.exports.closeSlot = function(sessionAttributes, message){
  return {
    sessionAttributes,
    dialogAction: {
      type: 'Close',
      fulfillmentState:'Fulfilled',
      message
    }
  }
}

function getResponseCard(title, imageUrl, buttons) {
  return {
    contentType: 'application/vnd.amazonaws.card.generic',
    genericAttachments: [
      {
        title,
        imageUrl,
        buttons
      }
    ]
  };
}