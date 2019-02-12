window.addEventListener('load', _ => {
  // Note that Web Blueooth must be initiated from a user gesture for security reasons
  const gestureButton = document.querySelector('#gestureButton');
  const statusDiv = document.querySelector('#statusDiv');

  gestureButton.addEventListener('click', async _ => {
    // Note that Onewheels show up with the following name format: `ow#######`
    // Note the service UUID is reverse engineered and you can use the Chrome Bluetooth internals tab for debugging: chrome://bluetooth-internals/#devices
    report('Obtaining the device…');
    const bluetoothDevice = await navigator.bluetooth.requestDevice({ filters: [ { namePrefix: 'ow' }, { services: ['e659f300-ea98-11e3-ac10-0800200c9a66'] } ] });

    report('Connecting to the GATT server…');
    const gattServer = await bluetoothDevice.gatt.connect();

    report('Obtaining the primary service…');
    const service = await gattServer.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');

    async function reunlock() {
      report('Initiating the unlock procedure…');
      await unlock(service, report);
      report();

      const unlockDate = new Date();
      unlockDate.setSeconds(unlockDate.getSeconds() + 15);
      report(`Scheduling the next unlock for ${unlockDate.toLocaleTimeString()}…`);
      window.setTimeout(reunlock, 15 * 1000);
    }

    reunlock();

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
      
      const characteristicDiv = document.createElement('div');
      characteristicDiv.className = 'characteristicDiv';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = knownName || characteristic.uuid;
      characteristicDiv.append(nameSpan);

      const valueSpan = document.createElement('span');
      if (characteristic.value !== null) {
        const value = [];
        for (let index = 0; index < characteristic.value.byteLength; index++) {
          value.push(characteristic.value.getUint8(index));
        }

        valueSpan.textContent = value.map(b => b.toString(16)).join(' ');
      } else {
        valueSpan.textContent = 'null';
      }
      
      characteristicDiv.append(valueSpan);

      const statusSpan = document.createElement('span');
      statusSpan.textContent = 'subscribing';
      characteristicDiv.append(statusSpan);

      document.body.append(characteristicDiv);
      
      try {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', event => {
          if (event.currentTarget.value !== null) {
            const value = [];
            for (let index = 0; index < event.currentTarget.value.byteLength; index++) {
              value.push(event.currentTarget.value.getUint8(index));
            }
  
            valueSpan.textContent = value.map(b => b.toString(16)).join(' ');
          } else {
            valueSpan.textContent = 'null';
          }

          statusSpan.textContent = new Date().toLocaleTimeString();
        });
      } catch (error) {
        statusSpan.textContent = 'error';
      }
    }
  });
  
  function report(message) {
    if (message === undefined) {
      statusDiv.textContent = '';
      return;
    }

    statusDiv.textContent += message + '\n';
  }

  async function unlock(service, onStatus) {
    onStatus('Obtaining the firmware revision characteristic…');
    const firmwareRevisionCharacteristic = await service.getCharacteristic('e659f311-ea98-11e3-ac10-0800200c9a66');

    onStatus('Reading the firmware revision value from the firmware revision characteristic…');
    const firmwareRevision = await firmwareRevisionCharacteristic.readValue();
    onStatus(`Determining the type of Onewheel from the firmware revision ${[...new Uint8Array(firmwareRevision)].map(d => '0x' + d.toString(16)).join(' ')}…`);

    if (firmwareRevision.byteLength !== 2) {
      onStatus('Found an unknown Onewheel type!');
      return;
    }

    // TODO: Find all firmware revisions that exists
    if (firmwareRevision.getUint8(0) === 22 && firmwareRevision.getUint8(1) === 56) {
      onStatus('Found a Onewheel+ XR');
    } else if (firmwareRevision.getUint8(0) === 16 && firmwareRevision.getUint8(1) === 38) {
      onStatus('Found a Onewheel+ XR');
    } else if (firmwareRevision.getUint8(0) === 15 && firmwareRevision.getUint8(1) === 194) {
      onStatus('Found a Onewheel+');
    } else {
      onStatus('Found an unknown Onewheel type!');
      return;
    }

    onStatus('Obtaining the UART serial read characteristic…');
    const uartSerialReadCharacteristic = await service.getCharacteristic('e659f3fe-ea98-11e3-ac10-0800200c9a66');

    // Note that this is an array of bytes which should total 20 bytes
    const challenge = [];

    async function onUartSerialReadCharacteristicChallengeValueChanged(event) {
      onStatus(`Collecting ${event.currentTarget.value.byteLength} bytes from the challenge UART read characteristic value…`);
      for (let index = 0; index < event.currentTarget.value.byteLength; index++) {
        challenge.push(event.currentTarget.value.getUint8(index));
      }

      if (challenge.length < 20) {
        onStatus(`Waiting for ${20 - challenge.length} more bytes from the challenge UART read characteristic value…`);
        return;
      }

      onStatus(`Unsubscribing from the UART serial read characteristic…`);
      await uartSerialReadCharacteristic.stopNotifications();
      uartSerialReadCharacteristic.removeEventListener('characteristicvaluechanged', onUartSerialReadCharacteristicChallengeValueChanged);

      onStatus(`Ensuring that the challenge signature ${challenge.slice(0, 3).map(d => '0x' + d.toString(16)).join(' ')} matches the known signature 0x43 0x52 0x58…`);
      if (challenge[0] !== 67 || challenge[1] !== 82 || challenge[2] !== 88) {
        onStatus(`The challenge signature doesn't match!`);
        return;
      }

      onStatus(`Joining the challenge sans the signature and check byte ${challenge.slice(3, -1).map(d => '0x' + d.toString(16)).join(' ')} and the known password 0xd9 0x25 0x5f 0x0f 0x23 0x35 0x4e 0x19 0xba 0x73 0x9c 0xcd 0xc4 0xa9 0x17 0x65…`);
      const password = [...challenge.slice(3, -1), 217, 37, 95, 15, 35, 53, 78, 25, 186, 115, 156, 205, 196, 169, 23, 101];
      
      // Note that the challenge and the response both start with the same 3 bytes: 0x43 0x52 0x58
      onStatus(`Hashing the final password ${password.map(d => '0x' + d.toString(16)).join(' ')} into the response…`);
      const response = [...challenge.slice(0, 3), ...md5(password)];

      onStatus(`Calculating the check byte from the response ${response.map(d => '0x' + d.toString(16)).join(' ')}…`);
      let checkByte = 0;
      for (let index = 0; index < response.length; index++) {
        checkByte = response[index] ^ checkByte;
      }

      onStatus(`Appending the check byte ${checkByte} to the response…`);
      response.push(checkByte);

      onStatus('Obtaining the UART serial write characteristic…');
      const uartSerialWriteCharacteristic = await service.getCharacteristic('e659f3ff-ea98-11e3-ac10-0800200c9a66');
  
      onStatus(`Writing to the response ${response.map(d => '0x' + d.toString(16)).join(' ')} to the UART serial write characteristic…`);
      await uartSerialWriteCharacteristic.writeValue(new Uint8Array(response));
  
      onStatus('Waiting for a bit before starting to read the characteristics…');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    onStatus('Subscribing to the UART serial read characteristic…');
    await uartSerialReadCharacteristic.startNotifications();
    uartSerialReadCharacteristic.addEventListener('characteristicvaluechanged', onUartSerialReadCharacteristicChallengeValueChanged);

    onStatus('Writing the firmware revision value to the firmware revision characteristic…');
    await firmwareRevisionCharacteristic.writeValue(firmwareRevision);
  }
});

// This function is an adapted and simplified MD5 hash function which runs only a single cycle and works only for 55 bytes or less
// It was adapted from http://www.myersdaily.org/joseph/javascript/md5.js, see http://www.myersdaily.org/joseph/javascript/md5-text.html for more info
// [104, 101, 108, 108, 111] ("hello") => "5d41402abc4b2a76b9719d911017c592"
function *md5(bytes) {
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
  for (let index = 0; index < 4; index ++) {
      let byte = state[0] & 0xff;
      yield byte;
      state[0] = (state[0] - byte) / 256;
  }

  state[1] = (b + state[1]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index ++) {
      let byte = state[1] & 0xff;
      yield byte;
      state[1] = (state[1] - byte) / 256;
  }

  state[2] = (c + state[2]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index ++) {
      let byte = state[2] & 0xff;
      yield byte;
      state[2] = (state[2] - byte) / 256;
  }

  state[3] = (d + state[3]) & 0xFFFFFFFF;
  for (let index = 0; index < 4; index ++) {
      let byte = state[3] & 0xff;
      yield byte;
      state[3] = (state[3] - byte) / 256;
  }
}
