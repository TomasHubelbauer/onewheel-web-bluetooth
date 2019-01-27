// Note that you can unpair a previously paired OW in the BT internals tab: chrome://bluetooth-internals/#devices
window.addEventListener('load', _ => {
  // Note that Web Blueooth must be initiated from a user gesture for security reasons
  const gestureButton = document.createElement('button');
  gestureButton.textContent = 'Pair';
  gestureButton.addEventListener('click', async _ => {
    // Note that Onewheels show up under *Onewheel* before pairing and *ow#######* once paired
    // TODO: Extend the filters to also see an unpaired Onewheel (need to unpair the existing one for that - Forget doesn't work)
    console.log('Obtaining the device');
    const bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [ { namePrefix: 'ow' } ],
      optionalServices: [
        // See the README for info on how to discover the available services & what characteristics are known
        // Note that this is the right BTLE service and the OW provides some others
        'e659f300-ea98-11e3-ac10-0800200c9a66',
      ]
    });
    
    console.log('Connecting the GATT server');
    const gattServer = await bluetoothDevice.gatt.connect();
    console.log('Obtaining the service');
    let service;
    try {
      service = await gattServer.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');
    } catch (error) {
      debugger;
    }
    
    console.log('Obtaining and setting the firmware revision characteristic');
    const firmwareRevisionCharacteristic = await service.getCharacteristic('e659f311-ea98-11e3-ac10-0800200c9a66');
    const firmwareRevision = await firmwareRevisionCharacteristic.readValue();
    console.log('Obtained the firmware revision characteristic value:', firmwareRevision);
    
    console.log('Obtaining the UART read characteristic');
    const uartReadCharacteristic = await service.getCharacteristic('e659f3fe-ea98-11e3-ac10-0800200c9a66');
    uartReadCharacteristic.addEventListener('characteristicvaluechanged', event => {
      debugger;
      console.log(event);
    });
    uartReadCharacteristic.oncharacteristicvaluechanged = event => {
      debugger;
      console.log(event);
    };
    
    console.log('Writing the firmware revision');
    await firmwareRevisionCharacteristic.writeValue(firmwareRevision);
    
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
  
  document.body.appendChild(gestureButton);
});
