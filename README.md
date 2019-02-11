# Onewheeel Odometer

This repository demonstrates the use of Web Bluetooth for connecting to a Onewheel,
carrying out the unlock mechanism and subscribing to the main service characteristics for debugging.

This project will be extended to support visual and non-visual (vibrator, speaker)
indicators of batter level, speed etc.

[**DEMO**](https://tomashubelbauer.github.io/onewheel-odometer/)

## How It Works

The way this works is that Web Bluetooth is used to find a turned on Onewheel and then pair with it.
While pairing, the application asks the device to provide several GATT services.

You can discover what GATT services a device broadcasts using the Chrome Bluetooth Internals tab:

- Go to `chrome://bluetooth-internals/#devices`
- Pair the Onewheel if not paired previously
- Click on *Inspect* next to the device you are interested in, Onewheels follow the `ow######` naming pattern
- Click on *Forget* in case you want to try the whole flow again: unpair and then pair
  - Note that this action is disabled if you are not connected to the GATT server (using *Inspect*)
- Observe the GATT services listed with their characteristics listed upon a click for expansion
  - Note that the BTLE service is the one with UUID of `e659f300-ea98-11e3-ac10-0800200c9a66`

## What Is Missing

- [ ] Recconect periodically to avoid being locked out of the Onewheel
- [ ] Find out all the known firmware versions

## Related Projects

- https://github.com/COM8/UWP-Onewheel
- https://github.com/kariudo/onewheel-bluetooth

## How Does The Unlock Flow Go

0. https://github.com/ponewheel/android-ponewheel/issues/86
1. Read the value of the firmware revision characteristic (`e659f311-ea98-11e3-ac10-0800200c9a66`)
2. Check that the firmware is 0x10 0x26 for the Onewheel+ XR on the Gemini firmware
3. Subscribe to the UART serial read characteristic (`e659f3fe-ea98-11e3-ac10-0800200c9a66`)
4. Write the value read from the firmware revision characteristic to the firmware revision characteristic
5. Keep handling the multiple the UART serial read characteristic callbacks until we collect 20 bytes
6. Unsubscribe from the UART serial read characteristic
7. Verify that the first three bytes of the 20 byte challenge value match the signature we know how to encode: 0x43 0x52 0x58
8. Prepare a buffer for the challenge response and append the sig bytes 0x43 0x52 0x58 to it
9. Prepare a buffer for MD5 hashing with remaining bytes from the challenge except last (total 16 bytes of the 20)
10. Append the known password 0xd9 0x25 0x5f 0x0f 0x23 0x35 0x4e 0x19 0ba 0x73 0x9c 0xcd 0xc4 0xa9 0x17 0x65 to the MD5 bufffer
11. Hash the MD5 buffer and add the resulting MD5 bytes to the response buffer which so far contains the 3 signature bytes
12. Calculate the check byte and add it to the response: `checkByte = 0; for (let i = 0; i < response.length; i++) checkByte = response[i] ^ checkByte;`
13. Write the response to the UART serial write characteristic
14. Subscribe to any interesting characteristics you care about
15. Keep unlocking every less than 24 seconds otherwise the Onewheel locks up

This code demonstrates the correct response derivation from a given challenge:

```js
const challengeText = '4352581f2e39be9702badaea0a0a0a0a0a708f15';
console.log('challenge', challengeText);
const challengeBytes = challengeText.match(/.{2}/g).map(b => Number.parseInt(b, 16));
const signatureBytes = challengeBytes.slice(0, 3);
const signatureText = signatureBytes.map(b => b.toString(16)).join(' ');
console.log('sig', signatureText);
const restBytes = challengeBytes.slice(3, -1); // Except last, should be 16
const restText = restBytes.map(b => b.toString(16)).join(' ') + ' = ' + restBytes.length;
console.log('rest', restText);
const passwordBytes = [217, 37, 95, 15, 35, 53, 78, 25, 186, 115, 156, 205, 196, 169, 23, 101];
const passwordText = passwordBytes.map(b => b.toString(16)).join(' ');
console.log('pass', passwordText);
const toMd5Bytes = [...restBytes, ...passwordBytes];
const toMd5Text = toMd5Bytes.map(b => b.toString(16)).join(' ');
console.log('to md5', toMd5Text);
const fromMd5Bytes = md5(toMd5Bytes.map(b => String.fromCharCode(b)).join('')).match(/.{2}/g).map(b => Number.parseInt(b, 16));
const fromMd5Text = fromMd5Bytes.map(b => b.toString(16)).join(' ');
console.log('from md5', fromMd5Text);
const responseBytes = [...challengeBytes.slice(0, 3), ...fromMd5Bytes];
const responseText = responseBytes.map(b => b.toString(16)).join(' ');
console.log('response', responseText);
let checkByte = 0;
for (let index = 0; index < responseBytes.length; index++) {
checkByte = responseBytes[index] ^ checkByte;
}

console.log('check byte', checkByte.toString(16));
```
