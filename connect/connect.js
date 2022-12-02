const mqtt = require("mqtt");
const { default: fetch } = require("node-fetch");

const client = mqtt.connect("http://broker.mqttdashboard.com");

const CONSTANTS = {
  HASURA_HOST: "http://localhost:8080",
  ADMIN_SECRET: "randompassword",
  MQTT_HOST: "http://broker.mqttdashboard.com",
  MQTT_CHANNEL: "digital_twin/android/#",
};

const debug = true;
var count = 0;
const log = console.log;

/* Helper Functions */

function getMutation(message, topic) {
  const device_id = topic.split("/")[1];
  const timestamp = new Date().toISOString();
  // console.log(message)
  return {
    query:
      "mutation AddDeviceData($data: jsonb!, $device_id: String!, $timestamp: timestamptz!){insert_device_data_one(object: {data: $data, device_id: $device_id,  timestamp:$timestamp}) {id}}",
    variables: {
      data: message,
      device_id,
      timestamp: message.timestamp
        ? new Date(message.timestamp).toISOString()
        : timestamp,
    },
    headers: {
      "x-hasura-admin-secret": CONSTANTS.ADMIN_SECRET,
    },
  };
}

function sendToHasura(body, HASURA_HOST) {
  debug && log(JSON.stringify(body, null, 2));

  return fetch(`${HASURA_HOST}/v1/graphql`, {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,ml;q=0.8",
      "content-type": "application/json",
      ...(body.headers || {}),
      "x-hasura-admin-secret": "randompassword",
    },
    method: "POST",
    body: JSON.stringify(body),
  })
    .then((res) => {
      count++;
      log(count + " mutations executed successfully");
      return res.json();
    })
    .then((resp) => debug && log(JSON.stringify(resp, null, 2)));
}

/* Handle MQTT subscriptions */
client.on("connect", function () {
  console.log(">>>");
  client.subscribe("digital_twin/android/#", function (err) {
    if (!err) {
      client.publish("digital_twin/android/sssa", "Hello mqtt");
    }
  });
});

client.on("message", function (topic, message) {
  // message is Buffer, convert this to generate GraphQL mutation from the message
  const decoded = getMutation(message.toString(), topic);
  sendToHasura(decoded, CONSTANTS.HASURA_HOST);
});
