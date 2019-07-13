window.addEventListener('load', _ => {
  const speedInput = document.getElementById('speedInput');
  const batteryInput = document.getElementById('batteryInput');
  const modeInput = document.getElementById('modeInput');
  const pitchInput = document.getElementById('pitchInput');
  const rollInput = document.getElementById('rollInput');
  const yawInput = document.getElementById('yawInput');

  // Web Blueooth must be initiated from a user gesture for security reasons
  const gestureButton = document.querySelector('#gestureButton');
  const statusDiv = document.querySelector('#statusDiv');

  gestureButton.addEventListener('click', async _ => {
    statusDiv.textContent = '';

    // Onewheels show up with the following name format: `ow#######`
    // The service UUID is reverse engineered and you can use the Chrome
    // Bluetooth internals tab for debugging: chrome://bluetooth-internals/#devices
    report('Obtaining the device…');
    let bluetoothDevice;
    try {
      bluetoothDevice = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'ow' }, { services: ['e659f300-ea98-11e3-ac10-0800200c9a66'] }] });
      gestureButton.remove();
    } catch (error) {
      report('Failed');
      return;
    }

    report('Connecting to the GATT server…');
    const gattServer = await bluetoothDevice.gatt.connect();

    report('Obtaining the primary service…');
    const service = await gattServer.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');

    report('Unlocking the board…');
    await unlock(service, report);

    report('Waiting for a bit before starting to read the characteristics…');
    await new Promise(resolve => setTimeout(resolve, 500));

    report('Subscribing all service characteristics for debugging…');
    const characteristics = await service.getCharacteristics();

    for (let characteristic of characteristics) {
      window['characteristic_' + characteristic.uuid.replace(/-/g, '_')] = characteristic;

      let knownName = '';
      switch (characteristic.uuid) {
        case 'e659F301-ea98-11e3-ac10-0800200c9a66': knownName = 'serial number'; break;
        case 'e659f311-ea98-11e3-ac10-0800200c9a66': knownName = 'firmware revision'; break;
        case 'e659f318-ea98-11e3-ac10-0800200c9a66': knownName = 'hardware revision'; break;
        case '00002a01-0000-1000-8000-00805f9b34fb': knownName = 'device name'; break;
        case 'e659f302-ea98-11e3-ac10-0800200c9a66': knownName = 'riding mode'; break;
        case 'e659f3fd-ea98-11e3-ac10-0800200c9a66': knownName = 'custom name'; break;
        case 'e659f30f-ea98-11e3-ac10-0800200c9a66': knownName = 'status'; break;
        case 'e659f317-ea98-11e3-ac10-0800200c9a66': knownName = 'safety HR'; break;
        case 'e659f31c-ea98-11e3-ac10-0800200c9a66': knownName = 'last errors'; break;
        case 'e659f31e-ea98-11e3-ac10-0800200c9a66': knownName = 'custom shaping'; break;
        case 'e659f31d-ea98-11e3-ac10-0800200c9a66': knownName = 'data 29'; break;
        case 'e659f31f-ea98-11e3-ac10-0800200c9a66': knownName = 'data 31'; break;
        case 'e659f320-ea98-11e3-ac10-0800200c9a66': knownName = 'data 32'; break;
        case 'e659f306-ea98-11e3-ac10-0800200c9a66': knownName = 'battery serial'; break;
        case 'e659f303-ea98-11e3-ac10-0800200c9a66': knownName = 'battery level'; break;
        case 'e659f304-ea98-11e3-ac10-0800200c9a66': knownName = 'battery low 5'; break;
        case 'e659f305-ea98-11e3-ac10-0800200c9a66': knownName = 'battery low 20'; break;
        case 'e659f315-ea98-11e3-ac10-0800200c9a66': knownName = 'battery low temp'; break;
        case 'e659f316-ea98-11e3-ac10-0800200c9a66': knownName = 'battery voltage'; break;
        case 'e659f312-ea98-11e3-ac10-0800200c9a66': knownName = 'battery amperage'; break;
        case 'e659f31b-ea98-11e3-ac10-0800200c9a66': knownName = 'battery cell voltages'; break;
        case 'e659f310-ea98-11e3-ac10-0800200c9a66': knownName = 'motor controller temp'; break;
        case 'e659f30c-ea98-11e3-ac10-0800200c9a66': knownName = 'lighting mode'; break;
        case 'e659f30e-ea98-11e3-ac10-0800200c9a66': knownName = 'lighting back'; break;
        case 'e659f30d-ea98-11e3-ac10-0800200c9a66': knownName = 'lighting front'; break;
        case 'e659f30b-ea98-11e3-ac10-0800200c9a66': knownName = 'speed rpm'; break;
        case 'e659f307-ea98-11e3-ac10-0800200c9a66': knownName = 'pitch'; break;
        case 'e659f308-ea98-11e3-ac10-0800200c9a66': knownName = 'roll'; break;
        case 'e659f309-ea98-11e3-ac10-0800200c9a66': knownName = 'yaw'; break;
        case 'e659f30a-ea98-11e3-ac10-0800200c9a66': knownName = 'trip odometer'; break;
        case 'e659f314-ea98-11e3-ac10-0800200c9a66': knownName = 'trip regen amp hours'; break;
        case 'e659f313-ea98-11e3-ac10-0800200c9a66': knownName = 'trip amp hours'; break;
        case 'e659f319-ea98-11e3-ac10-0800200c9a66': knownName = 'life odometer'; break;
        case 'e659f31a-ea98-11e3-ac10-0800200c9a66': knownName = 'life amp hours'; break;
        case 'e659f3ff-ea98-11e3-ac10-0800200c9a66': knownName = 'uart serial write'; break;
        case 'e659f3fe-ea98-11e3-ac10-0800200c9a66': knownName = 'uart serial read'; break;
        case '00002a00-0000-1000-8000-00805f9b34fb': knownName = 'client configuration'; break;
        case '00002a02-0000-1000-8000-00805f9b34fb': knownName = 'peripherial privacy flag'; break;
        case '00002a03-0000-1000-8000-00805f9b34fb': knownName = 'reconnection address'; break;
        case '00002a04-0000-1000-8000-00805f9b34fb': knownName = 'peripherial preferred connection parameters'; break;
        case '00002a05-0000-1000-8000-00805f9b34fb': knownName = 'service changed'; break;
      }

      if (knownName) {
        window['characteristic_' + knownName.replace(/ /g, '_')] = characteristic;
      }

      // Do not show UART read/write - they flash too much
      if (characteristic.uuid === 'e659f3fe-ea98-11e3-ac10-0800200c9a66' || characteristic.uuid === 'e659f3ff-ea98-11e3-ac10-0800200c9a66') {
        continue;
      }

      const characteristicDiv = document.createElement('div');
      characteristicDiv.className = 'characteristicDiv';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = knownName || characteristic.uuid;
      characteristicDiv.append(nameSpan);

      const valueSpan = document.createElement('span');
      valueSpan.textContent = characteristic.value !== null ? printDataView(characteristic.value) : 'null';
      characteristicDiv.append(valueSpan);

      const statusSpan = document.createElement('span');
      statusSpan.textContent = 'subscribing';
      characteristicDiv.append(statusSpan);

      const forceValueSpan = document.createElement('span');
      forceValueSpan.textContent = characteristic.value !== null ? printDataView(characteristic.value) : 'null';
      characteristicDiv.append(forceValueSpan);

      const forceStatusSpan = document.createElement('span');
      forceStatusSpan.textContent = 'waiting';
      characteristicDiv.append(forceStatusSpan);

      document.body.append(characteristicDiv);

      // Subscribe the legit way
      try {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', event => {
          if (event.currentTarget.value !== null) {
            if (event.currentTarget.value.byteLength == 2) {
              valueSpan.textContent = event.currentTarget.value.getUint16();
            } else {
              valueSpan.textContent = printDataView(event.currentTarget.value);
            }

            switch (knownName) {
              case 'speed rpm': {
                const speed = (((35 * event.currentTarget.value.getUint16()) / 39370.1) * 60).toPrecision(2) + ' km/h';
                speedInput.value = speed;
                break;
              }
              case 'battery level': {
                batteryInput.value = event.currentTarget.value.getUint16() + ' %';
                break;
              }
              case 'riding mode': {
                // TODO: Find out what Delirium maps to
                switch (event.currentTarget.value.getUint16()) {
                  case 1: modeInput.value = 'classic'; break;
                  case 2: modeInput.value = 'extreme'; break;
                  case 3: modeInput.value = 'elevated'; break;
                  case 4: modeInput.value = 'sequoia'; break;
                  case 5: modeInput.value = 'cruz'; break;
                  case 6: modeInput.value = 'mission'; break;
                  default: modeInput.value = 'unknown mode #' + event.currentTarget.value.getUint16(); break;
                }

                break;
              }
              case 'pitch': {
                pitchInput.value = event.currentTarget.value.getUint16();
                break;
              }
              case 'roll': {
                rollInput.value = event.currentTarget.value.getUint16();
                break;
              }
              case 'yaw': {
                yawInput.value = event.currentTarget.value.getUint16();
                break;
              }
            }
          } else {
            valueSpan.textContent = 'null';
          }

          statusSpan.textContent = new Date().toLocaleTimeString();
        });
      } catch (error) {
        statusSpan.textContent = 'error';
      }

      // Subscribe the force way
      window.setInterval(async () => {
        try {
          forceValueSpan.textContent = printDataView(await characteristic.readValue());
        } catch (error) {
          forceStatusSpan.textContent = 'error';
        }

        forceStatusSpan.textContent = new Date().toLocaleTimeString();
      }, 1000);
    }
  });

  function report(message) {
    statusDiv.textContent = new Date().toLocaleTimeString() + ' ' + message + '\n' + statusDiv.textContent;
  }
});

async function unlock(service, report) {
  // Clear the log the hacky way now that we're using unlocks instead of reminds
  document.getElementById('statusDiv').innerHTML = '';

  report('Obtaining the firmware revision characteristic…');
  let firmwareRevisionCharacteristic;
  try {
    firmwareRevisionCharacteristic = await service.getCharacteristic('e659f311-ea98-11e3-ac10-0800200c9a66');
  } catch (error) {
    report('Failed');

    // Retry
    window.setTimeout(unlock, 10 * 1000, service, report);
    return;
  }

  report('Reading the firmware revision value from the firmware revision characteristic…');
  const firmwareRevision = await firmwareRevisionCharacteristic.readValue();

  report(`Determining the type of Onewheel from the firmware revision ${printDataView(firmwareRevision)}…`);
  if (firmwareRevision.byteLength !== 2) {
    report('Found an unknown Onewheel type!');
    return;
  }

  // TODO: Find all firmware revisions that exists
  // TODO: Use hex literals here
  if (firmwareRevision.getUint8(0) === 22 && firmwareRevision.getUint8(1) === 56) {
    report('Found a Onewheel+ XR');
  } else if (firmwareRevision.getUint8(0) === 16 && firmwareRevision.getUint8(1) === 38) {
    report('Found a Onewheel+ XR');
  } else if (firmwareRevision.getUint8(0) === 15 && firmwareRevision.getUint8(1) === 194) {
    report('Found a Onewheel+');
  } else {
    report('Found an unknown Onewheel type!');
    return;
  }

  report('Obtaining the UART serial read characteristic…');
  const uartSerialReadCharacteristic = await service.getCharacteristic('e659f3fe-ea98-11e3-ac10-0800200c9a66');

  // Note that this is an array of bytes which should total 20 bytes
  const challenge = [];

  async function onUartSerialReadCharacteristicChallengeValueChanged(event) {
    if (challenge.length === 20) {
      // Ignore any messages received after the unlock challenge-response flow has been initiated and before the unsubscription took effect (does it ever?)
      return;
    }

    report(`Collecting ${event.currentTarget.value.byteLength} bytes ${printDataView(event.currentTarget.value)} from the challenge UART read characteristic value…`);
    for (let index = 0; index < event.currentTarget.value.byteLength; index++) {
      challenge.push(event.currentTarget.value.getUint8(index));
    }

    if (challenge.length < 20) {
      report(`Waiting for ${20 - challenge.length} more bytes (have ${challenge.length}) from the challenge UART read characteristic value…`);
      return;
    } else if (challenge.length > 20) {
      report(`Bailing as the challenge exceeded the expected 20 bytes!`);
      return;
    } else {
      report(`Proceeding with (${challenge.length}) bytes of the challenge UART read characteristic value…`);
    }

    report(`Unsubscribing from the UART serial read characteristic…`);
    await uartSerialReadCharacteristic.stopNotifications();
    uartSerialReadCharacteristic.removeEventListener('characteristicvaluechanged', onUartSerialReadCharacteristicChallengeValueChanged);

    const signature = [0x43, 0x52, 0x58];

    report(`Ensuring that the challenge signature ${printArray(challenge.slice(0, 3))} matches the known signature ${printArray(signature)}…`);
    if (challenge[0] !== signature[0] || challenge[1] !== signature[1] || challenge[2] !== signature[2]) {
      report(`The challenge signature doesn't match!`);

      // Retry
      window.setTimeout(unlock, 10 * 1000, service, report);
      return;
    }

    const appendix = [0xd9, 0x25, 0x5f, 0x0f, 0x23, 0x35, 0x4e, 0x19, 0xba, 0x73, 0x9c, 0xcd, 0xc4, 0xa9, 0x17, 0x65];

    report(`Joining the challenge without the signature with a check byte ${printArray(challenge.slice(3, -1))} and the known password ${printArray(appendix)}…`);
    const password = [...challenge.slice(3, -1), 217, 37, 95, 15, 35, 53, 78, 25, 186, 115, 156, 205, 196, 169, 23, 101];

    // Note that the challenge and the response both start with the same 3 bytes: 0x43 0x52 0x58
    report(`Hashing the final password ${printArray(password)} into the response…`);
    const response = [...challenge.slice(0, 3), ...md5(password)];

    report(`Calculating the check byte from the response ${printArray(response)}…`);
    let checkByte = 0;
    for (let index = 0; index < response.length; index++) {
      checkByte = response[index] ^ checkByte;
    }

    report(`Appending the check byte ${printArray([checkByte])} to the response…`);
    response.push(checkByte);

    report('Obtaining the UART serial write characteristic…');
    const uartSerialWriteCharacteristic = await service.getCharacteristic('e659f3ff-ea98-11e3-ac10-0800200c9a66');

    report(`Writing to the response ${printArray(response)} to the UART serial write characteristic…`);
    await uartSerialWriteCharacteristic.writeValue(new Uint8Array(response));
  }

  report('Subscribing to the UART serial read characteristic…');
  uartSerialReadCharacteristic.addEventListener('characteristicvaluechanged', onUartSerialReadCharacteristicChallengeValueChanged);
  await uartSerialReadCharacteristic.startNotifications();

  report('Writing the firmware revision value to the firmware revision characteristic…');
  try {
    await firmwareRevisionCharacteristic.writeValue(firmwareRevision);
  } catch (error) {
    report('Failed');
  }

  // TODO: Figure out why this won't work
  // Start the loop that keeps the board unlocked
  //remind(firmwareRevisionCharacteristic, report);

  // Brute-force the connection by just reconnecting all the time
  window.setTimeout(unlock, 10 * 1000, service, report);
}

async function remind(characteristic, report) {
  report(`Reminding the board to stay unlocked…`);

  try {
    report('Reading the firmware revision value from the firmware revision characteristic…');
    const firmwareRevision = await characteristic.readValue();

    report('Writing the firmware revision value to the firmware revision characteristic…');
    await characteristic.writeValue(firmwareRevision);
  } catch (error) {
    report('Lost connection or failed to renew handshake');
  }

  const unlockDate = new Date();
  unlockDate.setSeconds(unlockDate.getSeconds() + 15);

  report(`Scheduling the unlock reminder for ${unlockDate.toLocaleTimeString()}…`);
  window.setTimeout(remind, 15 * 1000, characteristic, report);
}

function printDataView(dataView) {
  let result = '';
  for (let index = 0; index < dataView.byteLength; index++) {
    const element = dataView.getUint8(index);
    if (element < 10) {
      result += '0';
    }

    result += element.toString(16);
    result += ' ';
  }

  result += '(hex)';
  return result;
}

function printArray(array) {
  let result = '';
  for (let element of array) {
    if (element < 10) {
      result += '0';
    }

    result += element.toString(16);
    result += ' ';
  }

  result += '(hex)';
  return result;
}

// This function is an adapted and simplified MD5 hash function which runs only
// a single cycle and works only for 55 bytes or less
// It was adapted from http://www.myersdaily.org/joseph/javascript/md5.js, see
// http://www.myersdaily.org/joseph/javascript/md5-text.html for more info
// [104, 101, 108, 108, 111] ("hello") => "5d41402abc4b2a76b9719d911017c592"
function* md5(bytes) {
  if (bytes.length > 55 || bytes.find(b => !Number.isInteger(b) || b < 0 || b > 255)) {
    throw new Error(`This MD5 function only works correctly for bytes arrays of 55 bytes or less.`);
  }

  const state = [1732584193, -271733879, -1732584194, 271733878]
  const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let i = 0;
  while (i < bytes.length) {
    tail[i >> 2] |= bytes[i] << ((i % 4) << 3);
    i++;
  }

  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  tail[14] = bytes.length * 8;

  let [a, b, c, d] = state;
  const cmn = (q, a, b, x, s, t) => {
    a = (((a + q) & 0xFFFFFFFF) + ((x + t) & 0xFFFFFFFF)) & 0xFFFFFFFF;
    return (((a << s) | (a >>> (32 - s))) + b) & 0xFFFFFFFF;
  };

  const ff = (a, b, c, d, x, s, t) => cmn((b & c) | ((~b) & d), a, b, x, s, t);
  a = ff(a, b, c, d, tail[0], 7, -680876936);
  d = ff(d, a, b, c, tail[1], 12, -389564586);
  c = ff(c, d, a, b, tail[2], 17, 606105819);
  b = ff(b, c, d, a, tail[3], 22, -1044525330);
  a = ff(a, b, c, d, tail[4], 7, -176418897);
  d = ff(d, a, b, c, tail[5], 12, 1200080426);
  c = ff(c, d, a, b, tail[6], 17, -1473231341);
  b = ff(b, c, d, a, tail[7], 22, -45705983);
  a = ff(a, b, c, d, tail[8], 7, 1770035416);
  d = ff(d, a, b, c, tail[9], 12, -1958414417);
  c = ff(c, d, a, b, tail[10], 17, -42063);
  b = ff(b, c, d, a, tail[11], 22, -1990404162);
  a = ff(a, b, c, d, tail[12], 7, 1804603682);
  d = ff(d, a, b, c, tail[13], 12, -40341101);
  c = ff(c, d, a, b, tail[14], 17, -1502002290);
  b = ff(b, c, d, a, tail[15], 22, 1236535329);

  const gg = (a, b, c, d, x, s, t) => cmn((b & d) | (c & (~d)), a, b, x, s, t);
  a = gg(a, b, c, d, tail[1], 5, -165796510);
  d = gg(d, a, b, c, tail[6], 9, -1069501632);
  c = gg(c, d, a, b, tail[11], 14, 643717713);
  b = gg(b, c, d, a, tail[0], 20, -373897302);
  a = gg(a, b, c, d, tail[5], 5, -701558691);
  d = gg(d, a, b, c, tail[10], 9, 38016083);
  c = gg(c, d, a, b, tail[15], 14, -660478335);
  b = gg(b, c, d, a, tail[4], 20, -405537848);
  a = gg(a, b, c, d, tail[9], 5, 568446438);
  d = gg(d, a, b, c, tail[14], 9, -1019803690);
  c = gg(c, d, a, b, tail[3], 14, -187363961);
  b = gg(b, c, d, a, tail[8], 20, 1163531501);
  a = gg(a, b, c, d, tail[13], 5, -1444681467);
  d = gg(d, a, b, c, tail[2], 9, -51403784);
  c = gg(c, d, a, b, tail[7], 14, 1735328473);
  b = gg(b, c, d, a, tail[12], 20, -1926607734);

  const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
  a = hh(a, b, c, d, tail[5], 4, -378558);
  d = hh(d, a, b, c, tail[8], 11, -2022574463);
  c = hh(c, d, a, b, tail[11], 16, 1839030562);
  b = hh(b, c, d, a, tail[14], 23, -35309556);
  a = hh(a, b, c, d, tail[1], 4, -1530992060);
  d = hh(d, a, b, c, tail[4], 11, 1272893353);
  c = hh(c, d, a, b, tail[7], 16, -155497632);
  b = hh(b, c, d, a, tail[10], 23, -1094730640);
  a = hh(a, b, c, d, tail[13], 4, 681279174);
  d = hh(d, a, b, c, tail[0], 11, -358537222);
  c = hh(c, d, a, b, tail[3], 16, -722521979);
  b = hh(b, c, d, a, tail[6], 23, 76029189);
  a = hh(a, b, c, d, tail[9], 4, -640364487);
  d = hh(d, a, b, c, tail[12], 11, -421815835);
  c = hh(c, d, a, b, tail[15], 16, 530742520);
  b = hh(b, c, d, a, tail[2], 23, -995338651);

  const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | (~d)), a, b, x, s, t);
  a = ii(a, b, c, d, tail[0], 6, -198630844);
  d = ii(d, a, b, c, tail[7], 10, 1126891415);
  c = ii(c, d, a, b, tail[14], 15, -1416354905);
  b = ii(b, c, d, a, tail[5], 21, -57434055);
  a = ii(a, b, c, d, tail[12], 6, 1700485571);
  d = ii(d, a, b, c, tail[3], 10, -1894986606);
  c = ii(c, d, a, b, tail[10], 15, -1051523);
  b = ii(b, c, d, a, tail[1], 21, -2054922799);
  a = ii(a, b, c, d, tail[8], 6, 1873313359);
  d = ii(d, a, b, c, tail[15], 10, -30611744);
  c = ii(c, d, a, b, tail[6], 15, -1560198380);
  b = ii(b, c, d, a, tail[13], 21, 1309151649);
  a = ii(a, b, c, d, tail[4], 6, -145523070);
  d = ii(d, a, b, c, tail[11], 10, -1120210379);
  c = ii(c, d, a, b, tail[2], 15, 718787259);
  b = ii(b, c, d, a, tail[9], 21, -343485551);

  state[0] = (a + state[0]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index++) {
    let byte = state[0] & 0xff;
    yield byte;
    state[0] = (state[0] - byte) / 256;
  }

  state[1] = (b + state[1]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index++) {
    let byte = state[1] & 0xff;
    yield byte;
    state[1] = (state[1] - byte) / 256;
  }

  state[2] = (c + state[2]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index++) {
    let byte = state[2] & 0xff;
    yield byte;
    state[2] = (state[2] - byte) / 256;
  }

  state[3] = (d + state[3]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index++) {
    let byte = state[3] & 0xff;
    yield byte;
    state[3] = (state[3] - byte) / 256;
  }
}
