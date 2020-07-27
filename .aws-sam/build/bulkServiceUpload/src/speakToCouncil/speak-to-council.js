'use strict';

const dispatch = require('./dispatch');

exports.speakToCouncil = (event, context, callback) => {
    try {
        console.log(`event.bot.name=${event.bot.name}`);
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};