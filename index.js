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
      
      // Note that the MD5 from http://www.myersdaily.org/joseph/javascript/md5.js, for more info visit http://www.myersdaily.org/joseph/javascript/md5-text.html
      // Note that the challenge and the response both start with the same 3 bytes: 0x43 0x52 0x58
      onStatus(`Hashing the final password ${password.map(d => '0x' + d.toString(16)).join(' ')} into the response…`);

      // TODO: Pull the MD5 function to the repo is the license allows and simplify it to operate directly on byte arrays
      const response = [...challenge.slice(0, 3), ...md5(password.map(b => String.fromCharCode(b)).join('')).match(/.{2}/g).map(b => Number.parseInt(b, 16))];

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
