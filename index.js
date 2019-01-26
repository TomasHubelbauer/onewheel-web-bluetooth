window.addEventListener('load', _ => {
  // Note that Web Blueooth must be initiated from a user gesture for security reasons
  const gestureButton = document.createElement('button');
  gestureButton.textContent = 'Pair';
  gestureButton.addEventListener('click', async _ => {
    // Onewheels show up under *Onewheel* before pairing and *ow#######* once paired
    // TODO: Extend the filters to also see an unpaired Onewheel (need to unpair the existing one for that)
    const bluetoothDevice = await navigator.bluetooth.requestDevice({
      filters: [ { namePrefix: 'ow' } ],
      optionalServices: [
        // Note that some Bluetooth services are standardized: https://www.bluetooth.com/specifications/gatt/services
        'battery_service',
        
        /* Note that Onewheel proprietary services & characteristics are taken from the Internet, probably reversing-engineered
           - https://github.com/drewbaumann/onewheel-web/blob/master/script/master.js
           - https://community.onewheel.com/topic/2002/ble-commands-for-battery-status-etc
           - https://pastebin.com/Mu35jQGz
        */
        // TODO: Plan on disassembling the Android application to find the hardcoded service UUIDs
        
        // Note that this should be the Onewheel BTLE service
        'e659f300-ea98-11e3-ac10-0800200c9a66',
      ]
    });
    
    // TODO: Implement the unlock as per https://github.com/kariudo/onewheel-bluetooth/blob/master/readdata.py
    const gattServer = await bluetoothDevice.gatt.connect();
    const service = await gattServer.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');
    const characteristics = await service.getCharacteristics();
    for (let characteristic of characteristics) {
      window[characteristic + characteristic.uuid.replace(/-/g, '')] = characteristic;
      
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
  });
  
  document.body.appendChild(gestureButton);
});
