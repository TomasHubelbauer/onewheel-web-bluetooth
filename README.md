# Onewheel Web Bluetooth

This repository demonstrates the use of Web Bluetooth for connecting to a Onewheel,
carrying out the unlock mechanism and subscribing to the main service characteristics for debugging.

This project will be extended to support visual and non-visual (vibrator, speaker)
indicators of batter level, speed etc.

[**DEMO**](https://tomashubelbauer.github.io/onewheel-web-bluetooth)

## How It Works

- Web Bluetooth is used to find and pair with a Onewheel over its GATT server
- The main service is found by the reverse-engineered UUID `e659f300-ea98-11e3-ac10-0800200c9a66`
- All services and their characteristics can be inspected using `chrome://bluetooth-internals`
- UART serial characteristics are used to carry out an unlock procedure described in detail below
- All Web Bluetooth characteristics are thus made available for reading/writing/subscription

## What Is Missing

See `TODO` comments in code.

The unlock mechanism works, but the periodical "reminder" to the board that we are still unlocked fails.
I have not been able to pin down why that might be.

## Related Projects

- https://github.com/COM8/UWP-Onewheel
- https://github.com/ponewheel/android-ponewheel
- https://github.com/kariudo/onewheel-bluetooth
- https://github.com/drewbaumann/onewheel-web

## How Does The Unlock Flow Go

Kudos to the good people of [this pOnewheel issue thread](https://github.com/ponewheel/android-ponewheel/issues/86)
who figured this stuff out.

1. Read the value of the firmware revision characteristic (`e659f311-ea98-11e3-ac10-0800200c9a66`)
2. Check that the firmware revision characteristic value is known (see the code)
3. Subscribe to the UART serial read characteristic (`e659f3fe-ea98-11e3-ac10-0800200c9a66`)
4. Write the firmware revision characteristic value back to the firmware revision characteristic to initiate unlocking
5. Collect the UART serial read characteristic value change callbacks until 20 challenge bytes are gathered
6. Unsubscribe from the UART serial read characteristic
7. Verify that the first three bytes of the 20 byte challenge value match the known signature `0x43 0x52 0x58`
8. Prepare a challenge response byte array and append the signature bytes `0x43 0x52 0x58` to it
9. Prepare a password byte array prefilled with the remaining 16 challenge bytes ignoring the last check byte
10. Append the known password `0xd9 0x25 0x5f 0x0f 0x23 0x35 0x4e 0x19 0ba 0x73 0x9c 0xcd 0xc4 0xa9 0x17 0x65` to it
11. Compute the MD5 cycle on the password byte array and append the resulting byte array to the response byte array
12. Append the check byte `checkByte = 0; for (let i = 0; i < response.length; i++) checkByte = response[i] ^ checkByte;`
13. Write the response byte array to the UART serial write characteristic

After carrying out these steps, the Onewheel should unlock and you should be able to read/write/subscribe to any
service characteristics you like. The list of know characteristics is in the code.

You need to unlock the Onewheel every 24 seconds or less otherwise if will lock you out.

This code demonstrates the correct response derivation from a given challenge:

```js
const challengeText = '4352581f2e39be9702badaea0a0a0a0a0a708f15';
console.log('challenge', challengeText);
const challengeBytes = challengeText.match(/.{2}/g).map(b => Number.parseInt(b, 16));
const signatureBytes = challengeBytes.slice(0, 3);
const signatureText = signatureBytes.map(b => b.toString(16)).join(' ');
console.log('sig', signatureText);
const restBytes = challengeBytes.slice(3, -1); // Except last byte, should be 16
const restText = restBytes.map(b => b.toString(16)).join(' ') + ' = ' + restBytes.length;
console.log('rest', restText);
const passwordBytes = [217, 37, 95, 15, 35, 53, 78, 25, 186, 115, 156, 205, 196, 169, 23, 101];
const passwordText = passwordBytes.map(b => b.toString(16)).join(' ');
console.log('pass', passwordText);
const toMd5Bytes = [...restBytes, ...passwordBytes];
const toMd5Text = toMd5Bytes.map(b => b.toString(16)).join(' ');
console.log('to md5', toMd5Text);
const fromMd5Bytes = [...md5(toMd5Bytes)];
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
