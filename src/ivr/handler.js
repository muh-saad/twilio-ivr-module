const path = require('path');
const pg = require(path.resolve('db/pg'));
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const queryDB = async(query, params) => {
  const {rows} = await pg.query(query, params);

  return rows;
};

// Greeting function where the user is asked to input his desired option
//
// Uses the gather function
exports.welcome = function welcome() {
  const voiceResponse = new VoiceResponse();

  const gather = voiceResponse.gather({
    action: '/ivr/menu',
    numDigits: '1',
    method: 'POST',
  });

  gather.say(
    `Thanks for dialing to Saad's IVR module\n 
    Please press 1 to forward the call\n 
    Press 2 to drop a voicemail.`,
    {loop: 2},
  );

  return voiceResponse.toString();
};

// User chooses the desired option from the IVR menu
exports.menu = function menu(digit) {
  const optionActions = {
    '1': forwardToNumber,
    '2': forwardToVoiceMail,
  };

  return (optionActions[digit])
    ? optionActions[digit]()
    : redirectWelcome();
};

// User call is forwarded to the number based on first selection
//
// Uses the dial function
function forwardToNumber() {
  const twiml = new VoiceResponse();
  twiml.say(
    'Forwarding your call',
    {voice: 'alice', language: 'en-US'},
  );

  twiml.dial('+'); //Number to route the call to

  return twiml.toString();
}

// User call is forwarded to voice mail based on the second option
//
// Record function is used to record the voicemail
// (Max length 20 seconds and can be ended by pressing asterisk from keypad
// Calls url with the IVR details to store data in DB
function forwardToVoiceMail() {
  const twiml = new VoiceResponse();

  twiml.say('Please leave a message at the beep.\nPress the star key when finished.');

  console.log('****** STARTING RECORDING *******');
  twiml.record({
    action: '/ivr/voicemail/save',
    method: 'GET',
    maxLength: 20,
    finishOnKey: '*',
  });

  twiml.say('Unable to get any recording...');

  return twiml.toString();
}

// The calling persons data along with the voice recording url is stored in DB
exports.saveVoiceMail = (context) => {
  let details = context.query;

  pg.query(`INSERT INTO voicemail (recording_id, from_number, from_country, recording_url, meta_data) 
        VALUES ($1, $2, $3, $4, $5)`,
    [details.RecordingSid, details.From, details.FromCountry, details.RecordingUrl, details],
    (error, results) => {
      if (error) {
        throw error;
      }

      console.info(results);
    });

  const twiml = new VoiceResponse();
  twiml.say(
    {voice: 'alice', language: 'en-US'},
    'Thanks for your message. Goodbye.');

  twiml.hangup();

  return twiml.toString();
};

// User is redirected to the main menu
function redirectWelcome() {
  const twiml = new VoiceResponse();

  twiml.say('Returning to the main menu', {
    voice: 'alice',
    language: 'en-US',
  });

  twiml.redirect('/ivr/welcome');

  return twiml.toString();
}

// IVR details are returned in JSON format
exports.getVoicemailDetails = async(res) => {
  let get_query = `select from_number, from_country, recording_url
                    from voicemail`,
    params = [];

  let result = await queryDB(get_query, params);
  return res.send(result);
};
