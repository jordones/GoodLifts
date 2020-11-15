const result = require('dotenv').config()
const got = require('got');

if (result.error) {
  throw result.error
}
 
// Registered env variables
console.log(result.parsed)

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER; // Send-as number
const notifyNumbers = process.env.NOTIFY_NUMBERS.split(','); // An array of phone numbers to notify
const clubNumber = process.env.GOOD_LIFE_CLUB_NUMBER;

const host = 'https://www.goodlifefitness.com';
const path = `/content/goodlife/en/book-workout/jcr:content/root/responsivegrid/workoutbooking.GetWorkoutSlots.${clubNumber}.json`;
let onceToken = false; // Used to prevent spamming errors to SMS
const alreadyNotifiedWorkouts = new Set(); // workout notify ignore-list
const client = require('twilio')(accountSid, authToken);
const MESSAGE_LIMIT = 1562;

function notifyAll(info) {
  if (!process.env.DEBUG) {
    notifyNumbers.forEach(number => {
      client.messages.create({
        body: info,
        from: twilioNumber,
        to: number
      })
      .then(message =>  console.log(message.status))
      .done();
    });
  } else {
    console.log(`DEBUG: ${info}`);
  }
}

function main() {
  got(`${host}${path}`).then(
    response => {
      if (response.body) {
        const parsedResponseBody = JSON.parse(response.body);
        if (parsedResponseBody.map.statusCode === 200) {
          const options = parsedResponseBody.map.response;
  
          // Map just the workouts array, flatten them with a depth of one so we end up with a single flat array
          // and filter for elements where option had no workouts
          const workouts = options.map(option => option.workouts).flat(1).filter(workout => workout !== undefined);
          // Filter for workouts that are schedulable
          const availableWorkouts = workouts.filter(workout => workout.availableSlots > 0);
          let message = `There are ${availableWorkouts.length} new slots available:`;
          let sendMessage = false;
          availableWorkouts.forEach((workout, index) => {
            try {
              if (alreadyNotifiedWorkouts.has(workout.identifier)) {
                console.log(`Skipping alert for ${workout.identifier} - Already notified`);
                return;
              };
              sendMessage = true;
              alreadyNotifiedWorkouts.add(workout.identifier);
              console.log(`Adding ${workout.identifier} to list of already notified workouts`);
              const formattedStartTime = new Date(workout.startAt).toString();
              const formattedEndTime = new Date(workout.endAt).toString();
              console.log(`There is an open booking for ${workout.gymArea} from ${formattedStartTime} to ${formattedEndTime}`);
              message = message.concat(`\n${index + 1}. ${formattedStartTime}\n`);
            } catch (err) {
              console.log(`Skipping notification for ${workout.identifier} - Error encountered`);
            }
            
          })

          if (sendMessage) {
            try {
              if (message.length > MESSAGE_LIMIT) {
                const numChunks = Math.ceil(message.length/MESSAGE_LIMIT);
                for (i = 0; i < numChunks; i++) {
                  const substr = message.substr(i * MESSAGE_LIMIT, MESSAGE_LIMIT);
                  notifyAll(substr);
                }
              } else {
                notifyAll(message);
              }
            } catch (err) {
              console.log('Failed to send message:\n', message);
            }
          }
        }
      }
    }
  ).catch( 
    () => {
      console.log(`Failed to GET json for club ${clubNumber}`);
      if (!onceToken) {
        onceToken = true;
        notifyAll(`Failed to GET json for club ${clubNumber}`);
      }
  });
}

main();
setInterval(main, 300000);