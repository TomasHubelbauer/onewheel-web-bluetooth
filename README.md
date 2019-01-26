# Onewheeel Odometer

This repository is dedicated to trying to use Web Bluetooth to read the Onewheel odometer value.

This project could be later extended to support non-visual speed and battery level indication.

[**Onewheel Web Bluetooth**](https://tomashubelbauer.github.io/onewheel-odometer/)

The way this works is that Web Bluetooth is used to find a turned on Onewheel and then pair with it.
While pairing, the application asks the device to provide several GATT services.

You can discover what GATT services a device broadcasts using the Chrome Bluetooth Internals tab:

- Go to chrome://bluetooth-internals/#devices
- Pair the Onewheel if not paired previously
- Click on *Inspect* next to the device you are interested in, Onewheels follow the `ow######` naming pattern
  - Before pairing, the device name is just `Onewheel`
  - [ ] Find out if the Web Bluetooth lookup will still work with filters set to the `ow` `namePrefix`
- Click on *Forget* in case you want to try the whole flow again: unpair and then pair
  - Note that this action is disabled if you are not connected to the GATT server (using *Inspect*)
- Observe the GATT services listed with their characteristics listed upon a click for expansion
  - Note that the BTLE service is the one with UUID of `e659f300-ea98-11e3-ac10-0800200c9a66`
- Check out https://github.com/kariudo/onewheel-bluetooth/blob/master/onewheel/characteristics.py for known characteristics
- Check out https://github.com/kariudo/onewheel-bluetooth/blob/master/readdata.py for the unlock flow implementation
