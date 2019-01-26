// Note that you can unpair a previously paired OW in the BT internals tab: chrome://bluetooth-internals/#devices
window.addEventListener('load', _ => {
  // Note that Web Blueooth must be initiated from a user gesture for security reasons
  const gestureButton = document.createElement('button');
  gestureButton.textContent = 'Pair';
  gestureButton.addEventListener('click', async _ => {
    // Note that Onewheels show up under *Onewheel* before pairing and *ow#######* once paired
    // TODO: Extend the filters to also see an unpaired Onewheel (need to unpair the existing one for that)
    const bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [ { namePrefix: 'ow' } ],
      optionalServices: [
        // See the README for info on how to discover the available services & what characteristics are known
        // Note that this is the right BTLE service and the OW provides some others
        'e659f300-ea98-11e3-ac10-0800200c9a66',
      ]
    });
    
    const gattServer = await bluetoothDevice.gatt.connect();
    const service = await gattServer.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');
    const characteristics = await service.getCharacteristics();
    
    // Print all characteristics with their changes for debugging
    for (let characteristic of characteristics) {
      window['characteristic' + characteristic.uuid.replace(/-/g, '')] = characteristic;
      
      const characteristicDiv = document.createElement('div');
      characteristicDiv.textContent = `${characteristic.uuid} ${characteristic.value}`;      
      document.body.appendChild(characteristicDiv);
      
      characteristic.addEventListener('characteristicvaluechanged', event => {
        characteristicDiv.textContent += ' changed ';
        console.log(event);
      });
    }
    
    window.service = service;
    console.log('service is at window.service');
    console.log('characteristics are at window.characteristic{uuid}');
    
    // TODO: Finalize the unlock flow as per https://github.com/kariudo/onewheel-bluetooth/blob/master/readdata.py
    console.log('Unlock time - listening for the UART read characteristic');
    const uartReadCharacteristic = await service.getCharacteristic('e659f3fe-ea98-11e3-ac10-0800200c9a66');
    uartReadCharacteristic.addEventListener('characteristicvaluechanged', console.log);
  });
  
  document.body.appendChild(gestureButton);
});
