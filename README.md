# GoodLifts

Get notified when gym scheduling slots open up at GoodLife.

Now that Gyms are restricted to 10 members at a time, you need to get creative if you want to get swole.


This script downloads the json response from a Good Life endpoint periodically (currently every 5 minutes).

Be a good internet citizen and avoid spamming unrestricted endpoints too frequently. 🙂


# Setup
Create a `.env` file in the project root with the following variables:

```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth_token
TWILIO_NUMBER=your-twilio-phone-number
GOOD_LIFE_CLUB_NUMBER=your-good-life-club-number # mine is 181, I have not tested that this works with other clubs
NOTIFY_NUMBERS=comma-delimited-list-of-numbers-to-notify
DEBUG=false # setting debug to true will prevent sending sms
```

To start the script:

```bash
$ npm install
$ npm start
```

To stop the script:

```bash
$ npm stop
```
