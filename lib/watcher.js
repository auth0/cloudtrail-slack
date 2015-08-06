var AWS    = require('aws-sdk');
var moment = require('moment');
var slack  = require('./slack');
var async  = require('async');
var colors = require('colors');
var LRU    = require("lru-cache");
var _      = require('lodash');

module.exports.watch = function (region) {
  var cloudtrail = new AWS.CloudTrail({
    region: region
  });

  var log = function (params) {
    var args = [colors.green(region + ': ')].concat([].slice.call(arguments));
    console.log.apply(console, args);
  };

  var sent = LRU({
    max: 1024 * 50,
    maxAge: 1000 * 60 * 60
  });

  function find_events (params) {
    log('query with', params);

    cloudtrail.lookupEvents(params, function(err, data) {
      if (err) {
        return log(err); // an error occurred
      }

      log('search returned ' + data.Events.length + ' events');

      var events = data.Events.filter(function (event) {
        return !sent.get(event.EventId);
      });

      events = _.sortBy(events, 'EventTime');

      async.forEach(events, slack.sendEvent, function (err) {
        if (err) {
          console.error(err);
          return process.exit(1);
        }

        events.forEach(function (event) {
          log('reported event', event.EventId, ' - ', event.EventTime);
          sent.set(event.EventId, true);
        });

        if (typeof data.NextToken !== 'undefined' || !data.NextToken) {
          log('No more events in the previous query.');
          return setTimeout(function () {
            delete params.NextToken;
            //AWS takes like 10 minutes to report activity.
            params.StartTime = moment().add(-20, 'm').toDate();
            find_events(params);
          }, 30 * 1000);
        }

        log('get more records from previous query');
        params.NextToken = data.NextToken;
        find_events(params);
      });
    });
  }

  find_events({
    MaxResults: 20,
    StartTime: moment().add(-20, 'm').toDate()
  });
};