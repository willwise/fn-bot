'use strict'

var AWS = require("aws-sdk");
AWS.config.update({region:'eu-west-2'});
var lexmodelbuildingservice = new AWS.LexModelBuildingService({apiVersion:'2017-04-19'});

exports.rebuildBot = async (event, context) => {

    console.log('running...')

    var slotName = process.env.SLOT_NAME

    const params = {
        version: "$LATEST",
        name: slotName
    };

    let slotTypePromise = await lexmodelbuildingservice.getSlotType(params).promise();
    console.log(slotTypePromise);
    console.log(event.Records);

    for (const record of event.Records) {
        if(record.eventName === "INSERT"){
            console.log('DynamoDB Record: %j', record.dynamodb.NewImage.ServiceName.S);
            var array = record.dynamodb.NewImage.Synonyms.S.split(',');
            console.log(array);
            slotTypePromise.enumerationValues.push({
                synonyms: array,
                value: record.dynamodb.NewImage.ServiceName.S
            });
        }
    }
    // return `Successfully processed ${event.Records.length} records.`;
    console.log(slotTypePromise.enumerationValues)

    var newSlot = {
        name: slotName,
        checksum: slotTypePromise.checksum,
        enumerationValues: slotTypePromise.enumerationValues,
        valueSelectionStrategy: 'TOP_RESOLUTION'
    }

    console.log(newSlot);

    var newBuild = await lexmodelbuildingservice.putSlotType(newSlot).promise();

    console.log('build complete');

    var intentName = process.env.INTENT_NAME

    var newParams = {
        version: "$LATEST",
        name: intentName
    }

    var intent = await lexmodelbuildingservice.getIntent(newParams).promise();

    console.log(intent);

    for (const item of intent.slots) {
        item.slotTypeVersion = "$LATEST"
    }

    delete intent['lastUpdatedDate'];
    delete intent['createdDate'];
    delete intent['version'];

    console.log(intent);

    var newIntent = await lexmodelbuildingservice.putIntent(intent).promise();

    console.log(newIntent);

    var botName = process.env.BOT_NAME

    var botParams = {
        name: botName,
        versionOrAlias: "$LATEST"
    }

    var bot = await lexmodelbuildingservice.getBot(botParams).promise();

    console.log(bot);

    for (const item of bot.intents) {
        item.intentVersion = "$LATEST"
    }

    delete bot['lastUpdatedDate'];
    delete bot['createdDate'];
    delete bot['version'];
    delete bot['status'];
    delete bot['failureReason']
    
    //var newBot = await lexmodelbuildingservice.putBot(bot).promise();

    //console.log(newBot);
};
