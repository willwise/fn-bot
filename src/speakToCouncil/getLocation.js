'use strict'

var axios = require('axios');
var apiUrl = process.env.OS_API_ENDPOINT;

module.exports = async function (postcode, apikey){

    const url = `${apiUrl}${postcode}&key=${apikey}&dataset=DPA`
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
