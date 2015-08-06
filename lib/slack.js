var moment = require('moment');

var Slack = require('slack-node');
var slack = new Slack();
slack.setWebhook(process.env.SLACK_WEBHOOK);

var _ = require('lodash');
var async = require('async');

var template = _.template('*${EventName}* from *${Username}*');

function friendly_title (field) {
  return field.replace(/([A-Z])/g, ' $1')
              .replace(/^./, function(str){ return str.toUpperCase(); });
}

var queue = async.queue(function (event, callback) {
  event.CloudTrailEvent = JSON.parse(event.CloudTrailEvent);

  // console.dir(event);

  var color = event.EventName.indexOf('Delete') > -1 ? 'danger' : 'good';

  var meta = _(event.CloudTrailEvent)
              .pick(['eventSource', 'eventName', 'awsRegion', 'sourceIPAddress', 'userAgent'])
              .map(function (value, key) {
                return {
                  title: friendly_title(key),
                  value: value,
                  short: true
                };
              }).value();

  slack.webhook({
    text: template(event),
    attachments: [
      {
        color: color,
        fields: meta
      }
    ]
  }, callback);
}, 1);

module.exports.sendEvent = function (event, callback) {
  queue.push(event, callback);
};