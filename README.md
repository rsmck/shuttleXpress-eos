# shuttleXpress-eos (should probably now be shuttle-eos!)

This is a pretty much unfinished script that allows you to use the Contour Shuttle Pro or ShuttleXpress (Now Called Media Controller Pro2 and Xpress)

This works on both macOS and Windows, and builds happily to an executable with deno.

Edit these two parameters in the file to point to your Eos console or ETCnomad (by default it will connect to ETCnomad on your local computer)
```
const EOS_CONSOLE_IP = "127.0.0.1";
const EOS_CONSOLE_PORT = 8000;
```
Then simply run the script and use your Shuttle/ShuttleXpress to control Eos, you can adjust the functionaltiy by changing the code - it's fairly obvious and simply commented, but by default it is configured as follows on the Shuttle Pro;

| Button | Standard Function | Press and Hold | with Shift 
|---------|------------------|----------------|----------------|
| Button 1 | Shutter A Thrust | Shutter A Angle ||
| Button 2 | Shutter B Thrust | Shutter B Angle ||
| Button 3 | Shutter C Thrust | Shutter C Angle ||
| Button 4 | Shutter D Thrust | Shutter D Angle ||
| Button 5 | Hue | Hue (Fine) ||
| Button 6 | Saturation | Saturation (Fine) ||
| Button 7 | Frame Assembly | Frame Assembly (Fine) ||
| Button 8 | Highlight |||
| Button 9 | Select Last |||
| Left Button | Intensity |||
| Right Button | 'Shift' |||
| Lower Left Top | Pan | Pan (Fine) |
| Lower Left Bottom | Tilt | Tilt (Fine) |
| Lower Right Top | Edge | Edge (Fine) |

In each case where the Shift function is not defined, shift enables fine adjustment of the parameter

And as below on the ShuttleXpress

Buttons (from left to right)
| Button | Standard Function | Press and Hold |
|---------|------------------|----------------|
| Button 1 | Intensity | Framing Shutter A |
| Button 2 | Pan | Framing Shutter B |
| Button 3 | Tilt | Framing Shutter C |
| Button 4 | Zoom | Framing Shutter D |
| Button 5 | | 'Shift' |

In each case holding Shift enables fine adjustment of the Intensity/Pan/Tilt/Zoom parameters

Holding shift whilst holding a button to access the framing shutters adjusts angle instead of thrust

### Where can I get one? 
 
Glad you asked, if you find this useful please consider using this affiliate link to get yours from Amazon :) 

Shuttle Xpress https://amzn.to/4gnYNww
Shuttle Pro https://amzn.to/4246eF3
