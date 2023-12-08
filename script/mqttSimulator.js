const mqtt = require('mqtt');
const brokerUrl = 'mqtt://localhost';
const options = {
  clientId: 'mqtt_simulator',
  clean: true,
};

const client = mqtt.connect(brokerUrl, options);

let moisture = 100;
let water = 100;
let irrigate = false;
let pumpStatus = false;

function irrigateCheck() {
  // conditions are met or pump is commanded
  if (irrigate || pumpStatus) {
    if (tankLevel > 0) {
      moisture = 100;
      water -= 10; // water in the tank, use it
    } else {
      moisture = 100;
      water = 100; // tank empty, user refills tank
    }
    irrigate = false;
    pumpStatus = false;
  }
}

// Mock data
function measure() {

  if (moisture > 0) {
    moisture -= 1;
  }

  const temp = Math.floor(Math.random() * 16) + 15;
  const light = Math.floor(Math.random() * 25000);
  const time = new Date().toISOString();;

  // example of user configuration/irrigation profile
  // if (temperature >= 15 && soilMoisture < 50) irrigate = true;

  irrigateCheck();

  const data = {
    water,
    moisture,
    temp,
    light,
    time
  };

  client.publish('telefarm/status', JSON.stringify(data));
}

client.on('connect', () => {
  console.log('MQTT ok');

  client.subscribe('telefarm/irrigate', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log('Subscribed to telefarm/irrigate');
    }
  });

  client.subscribe('telefarm/pump', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log('Subscribed to telefarm/pump');
    }
  });

  setInterval(() => {
    measure();
  }, 1000);
});

// Handle control messages from the UI
client.on('message', (topic, message) => {
  if (topic === 'telefarm/irrigate') {
    const payload = message.toString();
    if (payload === 'true') {
      irrigate = !irrigate;
      console.log(`Irrigation control message: ${payload}. Toggled irrigate to ${irrigate}`);
    }
  }
  else if (topic === 'telefarm/pump') {
    const payload = message.toString();
    if (payload === 'true') {
      pumpStatus = !pumpStatus;
      console.log(`Pump control message: ${payload}. Toggled pump to ${pumpStatus}`);
    }
  }
});

client.on('error', (error) => {
  console.error('Error:', error);
});
