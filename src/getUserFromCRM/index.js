'use strict'

var AWS = require("aws-sdk");
var axios = require("axios");
AWS.config.update({region:'eu-west-2'});


/**
 * Designed to be invoked directly
 * from Amazon Connect to return if
 * a user is found in a CRM system
 * 
 * @param {AWS Connect Contact Flow} event 
 * @param {*} context 
 */
exports.getUserFromCRM = async (event) => {

    let ORGS = [
        {
            COUNCIL: "NORTHAMPTON",
            API_KEY: process.env.NBC_API_KEY || null,
            ENDPOINT: process.env.NBC_API_ENDPOINT || null,
            isActive: true
        },
        {
            COUNCIL: "SOUTH NORTHAMPTONSHIRE",
            API_KEY: process.env.SNC_API_KEY || null,
            ENDPOINT: process.env.SNC_API_ENDPOINT || null,
            isActive: false
        },
        {
            COUNCIL: "DAVENTRY",
            API_KEY: process.env.DDC_API_KEY || null,
            ENDPOINT: process.env.DDC_API_ENDPOINT || null,
            isActive: false
        }
    ];

    let records = []; // to fill with found records from CRMS

    //Check incoming params from Amazon Connect event
    let customerEndpoint = event['Details']["ContactData"]["CustomerEndpoint"];
    
    if(customerEndpoint == undefined) throw Error("No customer phone number supplied");

    if(customerEndpoint["Type"] === "TELEPHONE_NUMBER") {
        let phoneNumber = customerEndpoint["Address"];

        for(const org in ORGS) {

            let _org = ORGS[org];

            if(_org.isActive) {

                //lookup user in each CRM (assumes JaduCXM for now)
                let isFound = await getUserFromJaduCXM({url: _org.ENDPOINT, apiKey: _org.API_KEY}, phoneNumber);

                if(isFound) {
                    records.push({
                        userFound: "true",
                        userCouncil: _org.COUNCIL
                    })
                }
            }
        };
    }

    /**
     * Handle response to Amazon Connect.
     * 
     * If the user was only found once, 
     * return true and the council name.
     * 
     * If they were not found return false.
     * 
     * If they were found in many systems
     * return false.
     * 
     * */
    if(records.length === 1) {
        return records[0];
    }

    return {
        userFound: "false"
    }
};

/**
 * 
 * @param { endpoint: string, apiKey: string } params 
 * @return {err, success: TRUE | FALSE, }
 */
async function getUserFromJaduCXM(endpoint, phoneNumber){
    // check endpoint and api key provided
    if (endpoint.url.length < 1 || endpoint.apiKey.length < 1) { throw Error("Please supply both a url endpoint and API key");}
    // check phone number provideed
    if (phoneNumber.length < 11) { throw Error("Please supply a phone number with at least 11 digits");}

    const url = `${endpoint.url}${phoneNumber}?key=${endpoint.apiKey}`
        try {
            const response = await axios.get(url);
            if(response.data.total === 1) {
                return true;
            }

            // if more than one record is found, return as if not found
            return false; //return true if only 1 record is found

        } catch (error) {
            console.log(error.response);
            return false;
        }
    
}
