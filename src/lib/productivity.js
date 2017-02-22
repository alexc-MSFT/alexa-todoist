exports.getProductivity = getProductivity;
exports.getKarmaScore = getKarmaScore;

var commands = require('./commands.js');
var request = require('request-promise');
var config = require('dotenv').config();
var helpers = require('./helpers.js');
var todoist = require('./todoist.js');
var todoistURL = 'https://todoist.com/API/v7/sync?token=' + config.TODOIST_ACCESS_TOKEN + '&sync_token=*&';

function getProductivity(that) {
      todoist.getProductivityStats(that).then(function (response) {
            console.log(response.karma);
      });
}

function getKarmaScore(that) {
    todoist.getProductivityStats(that).then(function (response) {
              that.emit(':tell', 'Your Karma score is  <say-as interpret-as="cardinal">' + response.karma + '</say-as>, keep up the good work!');
      });
}

