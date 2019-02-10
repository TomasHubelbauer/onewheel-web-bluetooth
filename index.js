window.addEventListener('load', _ => {
  // Note that Web Blueooth must be initiated from a user gesture for security reasons
  const gestureButton = document.querySelector('#gestureButton');
  const statusDiv = document.querySelector('#statusDiv');

  statusDiv.textContent = 'Ready.';

  gestureButton.addEventListener('click', async _ => {
    statusDiv.textContent = 'Obtaining the device…';

    // Note that Onewheels show up with the following name format: `ow#######`
    const bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [ { namePrefix: 'ow' } ],
      optionalServices: [
        // Note that you can use the Chrome Bluetooth internals tab for debugging: chrome://bluetooth-internals/#devices
        'e659f300-ea98-11e3-ac10-0800200c9a66',
      ]
    });

    statusDiv.textContent = 'Connecting to the GATT server…';
    const gattServer = await bluetoothDevice.gatt.connect();

    statusDiv.textContent = 'Obtaining the primary service…';
    let service;
    try {
      service = await gattServer.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');
    } catch (error) {
      statusDiv.textContent = 'Failed to obtain the primary service!';
      return;
    }
    
    try {
      statusDiv.textContent = 'Obtaining and setting the firmware revision characteristic…';

      const firmwareRevisionCharacteristic = await service.getCharacteristic('e659f311-ea98-11e3-ac10-0800200c9a66');
      const firmwareRevision = await firmwareRevisionCharacteristic.readValue();
      statusDiv.textContent = 'Obtained the firmware revision characteristic value.';

      statusDiv.textContent = 'Obtaining the UART read characteristic…';
      const uartReadCharacteristic = await service.getCharacteristic('e659f3fe-ea98-11e3-ac10-0800200c9a66');

      await uartReadCharacteristic.startNotifications();

      // TODO:
      /*
        array_to_md5 = key_input[3:19] + bytearray.fromhex("D9 25 5F 0F 23 35 4E 19 BA 73 9C CD C4 A9 17 65")
        hashed = md5(array_to_md5)
        key_output = bytearray.fromhex("43 52 58")
        key_output += hashed.digest()
        key_output += calculate_check_byte(key_output)

        print("Sending unlock key...")
        device.char_write(UUIDs.UartSerialWrite, key_output)
        device.unsubscribe(UUIDs.UartSerialRead)
        sleep(0.5)  # wait a moment for unlock
      */

      let key = [];
      statusDiv.textContent = 'Subscribing to the UART read characteristic…';
      uartReadCharacteristic.addEventListener('characteristicvaluechanged', _event => {
        for (let index = 0; index < uartReadCharacteristic.value.length; index++) {
          key.push(uartReadCharacteristic.value.getUint8(index));
        }

        statusDiv.textContent = 'Collecting the 20 bytes of the key, bytes so far: ' + key.length;
        if (key.length === 20) {
          // TODO: Fill the empty array from hex: D9 25 5F 0F 23 35 4E 19 BA 73 9C CD C4 A9 17 65
          const arrayToMd5 = key.slice(3, 19) + [];
          const sparkArray = new SparkMD5.ArrayBuffer();
          sparkArray.append(arrayToMd5);
          const hashed = sparkArray.end();

          // TODO: Fill the null in the array from hex: 43 52 58
          // TODO: Convert `hashed` from hex
          const keyOutput = [null, ...hashed];

          // TODO: Rip the `calculateCheckByte` implementation
          keyOutput.push(calculateCheckByte(keyOutput));

          // TODO: Send the unlock key
          // TODO: See if this can be pulled up and shared with this callback and the main flow
          const uartWrite = await service.getCharacteristic('e659f3ff-ea98-11e3-ac10-0800200c9a66');
          
          // TODO: Make this into an array buffer
          await uartWrite.writeValue(keyOutput);

          await uartReadCharacteristic.stopNotifications();

          // TODO: Wait some time for the unlock to finish and try reading status characteristics
        }
      });

      statusDiv.textContent = 'Writing the firmware revision…';
      console.log(await firmwareRevisionCharacteristic.writeValue(firmwareRevision));
      const uartWrite = await service.getCharacteristic('e659f3ff-ea98-11e3-ac10-0800200c9a66');
      await uartWrite.writeValue(firmwareRevision);
    } catch (error) {
      debugger;
    }
    
    // TODO: Finalize the unlock flow as per https://github.com/kariudo/onewheel-bluetooth/blob/master/readdata.py
    return;
    
    // Print all characteristics with their changes for debugging
    console.log('Fetching all characteristics for printing');
    const characteristics = await service.getCharacteristics();
    for (let characteristic of characteristics) {
      window['characteristic_' + characteristic.uuid.replace(/-/g, '_')] = characteristic;
      
      const characteristicDiv = document.createElement('div');
      characteristicDiv.textContent = `${characteristic.uuid} ${characteristic.value}`;      
      document.body.appendChild(characteristicDiv);
      
      characteristic.addEventListener('characteristicvaluechanged', event => {
        characteristicDiv.textContent += ' changed ';
        console.log(event);
      });
      
      characteristic.oncharacteristicvaluechanged = console.log;
    }
    
    window.service = service;
    console.log('service is at window.service');
    console.log('characteristics are at window.characteristic{uuid}');
  });
});
