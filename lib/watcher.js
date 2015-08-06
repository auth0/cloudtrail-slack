var AWS    = require('aws-sdk');
var moment = require('moment');
var slack  = require('./slack');
var async  = require('async');
var colors = require('colors');

module.exports.watch = function (region) {
  var cloudtrail = new AWS.CloudTrail({
    region: region
  });

  var log = function (params) {
    var args = [colors.green(region + ': ')].concat([].slice.call(arguments));
    console.log.apply(console, args);
  };

  function find_events (params) {
    cloudtrail.lookupEvents(params, function(err, data) {
      if (err) {
        return log(err); // an error occurred
      }

      log('search returned ' + data.Events.length + ' events');

      async.forEach(data.Events, slack.sendEvent, function (err) {
        if (err) {
          console.error(err);
          return process.exit(1);
        }

          if (typeof data.NextToken !== 'undefined' || !data.NextToken) {
            log('no more events in the previous query');
            return setTimeout(function () {
              delete params.NextToken;
              params.StartTime = moment().add(-5, 's').toDate();
              find_events(params);
            }, 5 * 1000);
          }

          log('get more records from previous query');
          params.NextToken = data.NextToken;
          find_events(params);
      });
    });
  }

  find_events({
    MaxResults: 20,
    StartTime: moment().add(-1, 'm').toDate()
  });
};