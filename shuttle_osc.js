// shuttleXpress OSC controller

const HID = require('node-hid');
var osc = require("osc");

const EOS_CONSOLE_IP = "127.0.0.1";
const EOS_CONSOLE_PORT = 8000;

const USB_VENDOR_ID = 2867;

var activeBtns = [];
var innerScroll = 0;
var outerJog = 0;
var outerJogLast = 0;
var strMode = 'intens';

const BUTTON_MAP = {
    0x10: "intens",
    0x20: "pan",
    0x40: "tilt",
    0x80: "zoom",
    0x01: "x"
};

// OSC
var oscUdp = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 57121,
    metadata: true
});
oscUdp.open();

// connect
connectShuttle();

function connectShuttle() {
    console.log("Searching for HID device...");

    const devices = HID.devices();
    const deviceInfo = devices.find(d => d.vendorId === USB_VENDOR_ID);

    if (!deviceInfo) {
        console.log("Shuttle not found, retrying...");
        setTimeout(connectShuttle, 2000); // Retry after 2 seconds
        return;
    }

    try {
        device = new HID.HID(deviceInfo.path);
        console.log("Connected to Shuttle...");

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
    // parse the pressed buttons
    activeBtns = [];
    for (const [btnVal, label] of Object.entries(BUTTON_MAP)) {
        if (data[3] & btnVal || data[4] & btnVal) {
            activeBtns.push(label);
            if (label != 'x') { strMode = label; }
        }
    }

    // jog dial
    if (data[0] > 128) {
        outerJog = data[0]-255;
    } else if (data[0] < 128) {
        outerJog = data[0];
    }
    if (outerJog != outerJogLast) {
        outerJogLast = outerJog;
        execOscJog(outerJog);       
    }

    // handle the infinite wheel encoder
    if (data[1] == 255 && innerScroll == 0) {
        execOscEncoder(1);
    } else if (data[1] == 0 && innerScroll == 255) {
        execOscEncoder(-1);
    } else if (data[1] > innerScroll) { 
        execOscEncoder(1);
    } else if (data[1] < innerScroll) { 
        execOscEncoder(-1);
    }
    innerScroll = data[1];
}

function execOscEncoder(dir) {
    let strWheelMsg = '/eos/wheel';

    // this is messy, as it was adapted to add framing function (not included before)
    if (activeBtns.includes('intens')) {
        if (activeBtns.includes('x')) {
            strWheelMsg += '/frame_angle_a';
        } else {
            strWheelMsg += '/frame_thrust_a';
        }
    } else if (activeBtns.includes('pan')) {
        if (activeBtns.includes('x')) {
            strWheelMsg += '/frame_angle_b';
        } else {
            strWheelMsg += '/frame_thrust_b';
        }
    } else if (activeBtns.includes('tilt')) {
        if (activeBtns.includes('x')) {
            strWheelMsg += '/frame_angle_c';
        } else {
            strWheelMsg += '/frame_thrust_c';
        }
    } else if (activeBtns.includes('zoom')) {
        if (activeBtns.includes('x')) {
            strWheelMsg += '/frame_angle_d';
        } else {
            strWheelMsg += '/frame_thrust_d';
        }
    } else {
        if (activeBtns.includes('x')) {
            strWheelMsg += '/fine';
        } else {
            strWheelMsg += '/coarse';
        }
        strWheelMsg += '/'+strMode;
    }

    oscUdp.send({
        address: strWheelMsg,
        args: [{type: "f", value: dir*3}]
    }, EOS_CONSOLE_IP, EOS_CONSOLE_PORT);

}

function execOscJog(dir) {
    // don't do anything with this yet
}
