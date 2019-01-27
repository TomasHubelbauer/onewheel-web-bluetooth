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

## Status

The Onewheel can be paired with and its services and their characteristics can be discovered using the
Chrome Bluetooth Internals tab.

The unlock process is being worked on, based on the work of [@kariudo](https://github.com/kariudo/onewheel-bluetooth).
Right now the UART read characteristics doesn't seem to emit any events, but it is possible that I am just missing
them because I listed to all the characteristics after enumerating them and it takes a bit of time.
The next step is to comment out the code for displaying all the characteristics and notifying about their changes
(which doesn't work right now anyway, presumable because of the unlock not being completed) and instead subscribe
directly to the UART read characteristic changes. If that works, rip @kariudo's code and implement the unlock flow.
Afterwards we should start getting reads on the characteristics properly.

[Here's a quick tutorial on using Web Bluetooth in Chrome](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web). It is useful for mapping the Python Bluetooth GATT API to the Web Bluetooth one.

- [ ] Try the Python app and see if that connects successfully, if yes, try to find difference between its impl and mine
  - If not, check out the UWP version
  - Also try completely clearing remembered BT devices, the forgetting doesn't seem to work, it's still paired
  - https://github.com/COM8/UWP-Onewheel/blob/master/OnewheelBluetooth/Classes/OnewheelUnlockHelper.cs
  - https://github.com/ponewheel/android-ponewheel/issues/86#issuecomment-440809066
  - Use Python from WSL or in a VM to avoid installing on the host
