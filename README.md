# shuttleXpress-eos

This is a pretty much unfinished script that allows you to use the Contour Shuttle Xpress (Now Called Media Controller Xpress)

I've only tested it on macOS but no reason it shouldn't work on Windows either. At some point I'll make this into a friendly application rather than a command-line tool, but given the intended audience I don't imagine you'll have any problems with the command line version. 

Edit these two parameters in the file to point to your Eos console or ETCnomad (by default it will connect to ETCnomad on your local computer)
```
const EOS_CONSOLE_IP = "127.0.0.1";
const EOS_CONSOLE_PORT = 8000;
```
Then simply run the script and use your ShuttleXpress to control Eos, you can adjust the functionaltiy by changing the code - it's fairly obvious and simply commented, but by default it is configured as follows;

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

https://amzn.to/4gnYNww
