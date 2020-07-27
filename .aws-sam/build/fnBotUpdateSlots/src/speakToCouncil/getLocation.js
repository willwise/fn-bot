'use strict'

var axios = require('axios');

module.exports = async function (postcode, apikey){

    const url = `https://api.ordnancesurvey.co.uk/places/v1/addresses/postcode?postcode=${postcode}&key=${apikey}&dataset=DPA`
        try {
            const response = await axios.get(url);
            const data = response.data;
            console.log(data)
            return response;
        } catch (error) {
            console.log(error.response);
            return error
        }
    
}
