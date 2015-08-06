Watch CloudTrail and send notifications of every action to an slack channel.

## Installation

```
npm i -g auth0/cloudtrail-slack
```

## Usage

Configure a daemon that runs the following command:

```
SLACK_WEBHOOK=http://your-slack-webhook \
	REGIONS=us-west-1,us-east-1
	cloudtrail-slack
```

## License

MIT 2015 - Auth0 Inc.