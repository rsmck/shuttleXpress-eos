/*
 * Contour Shuttle Pro2/Xpress for Eos
 *
 * This is a simple script to use a Contour Shuttle Pro2 as a
 * controller for ETC Eos (or more specifically Nomad, although
 * it does also work with an Element) to provide a travel (and
 * budget) friendly encoder.
 *
 * This will work with *both* the Shuttle Pro and ShuttleXpress
 *
 * If you came here with the promise of a version with a config
 * file, sorry, I removed it because the validation was a pain.
 * I'll put it back some time, but until then you can see the 
 * mapping in CONFIG_BTN below - change this as you see fit.
 *
 * You can see the default mapping here;
 *  https://rsmck.co.uk/blog/contour-shuttle-pro-for-eos-encoders/
 *
 * You can purchase one using my Amazon affiliate code here (and
 * I will receive about 3% or something like that) as a thank you
 * if you find it useful https://amzn.to/4246eF3
 *
 * As usual, this is provided as-is and without warranty of any 
 * kind. I find it useful, and I hope others do too. 
 * 
 */

const HID = require('node-hid');
const { Client, Server } = require('node-osc');

const EOS_CONSOLE_IP = "127.0.0.1";
const EOS_CONSOLE_PORT = 8000;

const USB_VENDOR_ID = 2867;

const DOUBLE_CLICK_TIME = 250;

var activeBtns = [];
var lastBtns = [];
var innerScroll = -1;
var outerJog = 0;
var outerJogLast = 0;
var strEncOscString = '/eos/wheel/intens/coarse';
var strMode = '';
var buttonShift = '';
var bolStickyShift = false;
let device = null;
var lastBtnPress = {};

const BUTTON_MAP = [
  "t1", "t2", "t3", "t4", "t5",
  "t6", "t7", "t8", "t9", "ul",
  "ur", "ll", "lr", "sl", "sr",
];

var CONFIG_BTN = {};

// Shuttle PRO 2
const CONFIG_BTN_PRO = {
  "t1": [{"mode": "e", "osc": "/eos/wheel/coarse/frame_thrust_a"}, {"mode": "e", "osc": "/eos/wheel/coarse/frame_angle_a"}, false],
  "t2": [{"mode": "e", "osc": "/eos/wheel/coarse/frame_thrust_b"}, {"mode": "e", "osc": "/eos/wheel/coarse/frame_angle_b"}, false],
  "t3": [{"mode": "e", "osc": "/eos/wheel/coarse/frame_thrust_c"}, {"mode": "e", "osc": "/eos/wheel/coarse/frame_angle_c"}, false],
  "t4": [{"mode": "e", "osc": "/eos/wheel/coarse/frame_thrust_d"}, {"mode": "e", "osc": "/eos/wheel/coarse/frame_angle_d"}, false],
  "t5": [{"mode": "e", "osc": "/eos/wheel/coarse/hue"}, {"mode": "e", "osc": "/eos/wheel/fine/hue"}, false],
  "t6": [{"mode": "e", "osc": "/eos/wheel/coarse/saturation"}, {"mode": "e", "osc": "/eos/wheel/fine/saturation"}, false],
  "t7": [{"mode": "e", "osc": "/eos/wheel/coarse/frame_assembly"}, {"mode": "e", "osc": "/eos/wheel/sat"}, false],
  "t8": [{"mode": "t", "osc": ["/eos/key/highlight", "/eos/key/enter"]}, false, false],
  "t9": [{"mode": "t", "osc": "/eos/key/select_last"}, false, false],
  "ur": [{"mode": "e", "osc": "/eos/wheel/coarse/edge"}, {"mode": "e", "osc": "/eos/wheel/fine/edge"}, false],
  "lr": [{"mode": "e", "osc": "/eos/wheel/coarse/zoom"}, {"mode": "e", "osc": "/eos/wheel/fine/zoom"}, false],
  "ul": [{"mode": "e", "osc": "/eos/wheel/coarse/tilt"}, {"mode": "e", "osc": "/eos/wheel/fine/tilt"}, false],
  "ll": [{"mode": "e", "osc": "/eos/wheel/coarse/pan"}, {"mode": "e", "osc": "/eos/wheel/fine/pan"}, false],
  "sl": [{"mode": "e", "osc": "/eos/wheel/coarse/intens"}, {"mode": "e", "osc": "/eos/wheel/fine/intens"}, false],
  "sr": [{"mode": "s"}, false, false],
  "jl": [{"mode": "t", "osc": "/eos/key/last"}, false, false],
  "jr": [{"mode": "t", "osc": "/eos/key/next"}, false, false],
}

// ShuttleXpress
const CONFIG_BTN_XPRESS = {
  "t5": [{"mode": "e", "osc": "/eos/wheel/intens"}, {"mode": "e", "osc": "/eos/wheel/frame_angle_a"}, {"mode": "e", "osc": "/eos/wheel/frame_thrust_a"}],
  "t6": [{"mode": "e", "osc": "/eos/wheel/pan"}, {"mode": "e", "osc": "/eos/wheel/frame_angle_b"}, {"mode": "e", "osc": "/eos/wheel/frame_thrust_b"}],
  "t7": [{"mode": "e", "osc": "/eos/wheel/tilt"}, {"mode": "e", "osc": "/eos/wheel/frame_angle_c"}, {"mode": "e", "osc": "/eos/wheel/frame_thrust_c"}],
  "t8": [{"mode": "e", "osc": "/eos/wheel/zoom"}, {"mode": "e", "osc": "/eos/wheel/frame_angle_d"}, {"mode": "e", "osc": "/eos/wheel/frame_thrust_d"}],
  "t9": [{"mode": "s"} , false, false],
  "jl": [{"mode": "t", "osc": "/eos/key/last"}, false, false],
  "jr": [{"mode": "t", "osc": "/eos/key/next"}, false, false],
}

// OSC
const oscUdp = new Client(EOS_CONSOLE_IP, EOS_CONSOLE_PORT);

console.log("// ShuttlePro2 / ShuttleXpress for Eos");
console.log("// Ross Henderson ~ ross@rmlx.co.uk");
console.log("// ");
console.log("// Set EOS to OSC UDP on Port 8000 (Default)");
console.log(" ");

// connect
connectShuttle();

function connectShuttle() {
    console.log("Searching... ");

    const devices = HID.devices();
    const deviceInfo = devices.find(d => d.vendorId === USB_VENDOR_ID);
    
    if (!deviceInfo) {
        console.log("Shuttle not found, retrying...");
        setTimeout(connectShuttle, 2000); // Retry after 2 seconds
        return;
    }

    try {
        device = new HID.HID(deviceInfo.path);

    	if (deviceInfo.productId == 32 || deviceInfo.product == 'ShuttleXpress') {
    		CONFIG_BTN = CONFIG_BTN_XPRESS;
	        console.log("Connected to ShuttleXpress...");
       	} else {
			CONFIG_BTN = CONFIG_BTN_PRO;
	        console.log("Connected to ShuttlePRO2...");
       	}

		// find the shift if there is one 
		for (var i in CONFIG_BTN) {
			if (CONFIG_BTN[i][0].mode == 's') {
				buttonShift = i;
				break;
			}
		}

        device.on("data", (data) => {
            parseState(data);
        });

        device.on("error", (err) => {
            console.error("Lost Shuttle Error:", err);
            console.log("Attempting to reconnect...");
            device = null; 
            connectShuttle(); 
        });

    } catch (err) {
        console.error("Failed to connect to Shuttle:", err);
        setTimeout(connectShuttle, 2000); // Retry if opening fails
    }
}

function parseState(data) {
	// We have the concept of a double click now ... 
	now = Date.now();

    // parse the pressed buttons
    var activeBtns = [];
    
    var bolShiftPressed = false;
    var bolDoubleClick = false;

    var strTempOscString = ''; // ephemeral
    
    var bolLazyShift = true;
    
	const low = data[data.length - 2];  // second to last byte
	const high = data[data.length - 1]; // last byte

	// Combine into 16-bit bitmask
	const bitmask = (high << 8) | low;
	
	// Decode pressed buttons
	BUTTON_MAP.forEach((btn, idx) => {
		if (bitmask & (1 << idx)) {
		  activeBtns.push(btn);
		}
	});
	
	// is the 'shift' key held and defined
	bolShiftPressed = activeBtns.includes(buttonShift);
	if (bolStickyShift) bolShiftPressed = true;
	
	// If a button is pressed, remap or act on it
	activeBtns.forEach((btn, idx) => {
		if (CONFIG_BTN[btn] != undefined) {
			if (lastBtnPress[btn] != undefined && lastBtnPress[btn] > now-DOUBLE_CLICK_TIME) {
				bolDoubleClick = true;
			}
			
			if (CONFIG_BTN[btn][0].mode == 's') {
				// this is the 'shift' button, so it can't do anything else
				if (bolDoubleClick) {
					bolStickyShift = true;
				} else {
					bolStickyShift = false;
				}
			} else {
				let cfg = CONFIG_BTN[btn];
				if (cfg.length == 3 && bolShiftPressed == true) {
					// hacky solution that actually makes the code simpler
					// if the shift key is held, then just replace the config
					// with that in the position for shift and continue as 
					// normal...
					if (cfg[2]) cfg[0] = cfg[2];
					bolLazyShift = false;
				}
				
				// now handle the button as usual

				if (cfg.length > 1 && bolShiftPressed == false) {
					// this button has a different behaviour for "held"
					// which only makes sense for an encoder
					switch (cfg[1].mode) {
						case 'e':
							// this is an encoder override the osc whilst held
							strTempOscString = cfg[1].osc;
							break;
						default:
							// do nothing it makes no sense 
							break;
					}
				}
				
				// handle the 'normal' function
				switch (cfg[0].mode) {
					case 'e':
						// this changes the encoder function
						strEncOscString = cfg[0].osc;
						break;
					case 'k':
						// OSC key
						if (!bolShiftPressed) {
							// this is an OSC key with an up/down event
							if (!lastBtns.includes(btn)) {
								oscUdp.send(cfg[0].osc, 1);
							}
						}
						break;
					case 't':
						// this is an OSC trigger which fires once
						if (!lastBtns.includes(btn)) {
							if (typeof cfg[0].osc == 'object') {
								cfg[0].osc.forEach((osc, idx) => {
									oscUdp.send(osc);
								});
							} else {
								oscUdp.send(cfg[0].osc);
							}
						}
						break;
				}
			}
		}
	});
	
	// quickly check the last buttons for a keyUp event
	lastBtns.forEach((btn, idx) => {
		var cfg = CONFIG_BTN[btn];
		if (!activeBtns.includes(btn) && cfg != undefined && cfg.length > 0) {
			lastBtnPress[btn] = now;
			if (cfg[0].mode == 'k') {
				oscUdp.send(strKeyOsc, 0);
			}
		}
	});

	// so we know if buttons change
	lastBtns = [...activeBtns];
	
	// if we don't have an override, use the currently active one 
	if (strTempOscString == '') strTempOscString = strEncOscString;
	
	// if the shift key was pressed, and we don't have a defined 
	// function for it, treat it as a 'fine' rather than coarse
	// attribute in the most primitive way possible
	if (bolShiftPressed && bolLazyShift) {
		strTempOscString = strTempOscString.replace("/coarse","/fine");
	}
    
    // jog dial
    if (data[0] > 128) {
        outerJog = data[0]-255;
    } else if (data[0] < 128) {
        outerJog = data[0];
    }
    
    if (outerJog != outerJogLast) {
        execOscJog(outerJog);       
        outerJogLast = outerJog;
    }

    // handle the infinite wheel encoder
    if (innerScroll == -1) {
		// discard the first message
	} else if (data[1] == 255 && innerScroll == 0) {
        execOscEncoder(strTempOscString, 1);
    } else if (data[1] == 0 && innerScroll == 255) {
        execOscEncoder(strTempOscString, -1);
    } else if (data[1] > innerScroll) { 
        execOscEncoder(strTempOscString, 1);
    } else if (data[1] < innerScroll) { 
        execOscEncoder(strTempOscString, -1);
    }
    
    innerScroll = data[1];
}

function execOscEncoder(strWheelMsg, dir) {
    oscUdp.send(strWheelMsg, dir*3);
}

function execOscJog(dir) {
	if (outerJogLast == 0) { 
    	if (dir > 0) {
			oscUdp.send(CONFIG_BTN['jr'][0].osc);
    	} else if (dir < 0) {
			oscUdp.send(CONFIG_BTN['jl'][0].osc);
		}    
     }
     outerJogLast = dir;
}
