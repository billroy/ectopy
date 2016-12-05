// cms50d.js
//
// Copyright 2016 by Bill Roy - MIT license
//

// parse command line arguments
var argv = require('yargs')
    .usage('Usage: $0 --port=[3000] --ssl --certs=[~/.certs]')
    .default('serialport', '/dev/tty.SLAB_USBtoUART')
    .default('baud', 19200)
    .default('url', 'http://localhost:3000/beat')
    .argv;

console.log('cms50d here! v0.1');
console.log(argv);

var request = require('request');

// Which serial port?
//
shell = require("shelljs");
var port, portlist, portname;
var serial_buffer = '';

if (argv.serialport) portlist = [argv.serialport];
else if (process.platform === 'darwin') portlist = shell.ls("/dev/tty.usb*");
else if (process.platform === 'linux') portlist = shell.ls("/dev/ttyUSB*");

if (portlist.length === 0) {
	process.stdout.write('No ports found.\n');
	process.exit(-1);
}
else if (portlist.length > 1) {
	process.stdout.write('Trying first of multiple ports:\n' + portlist.join('\n'));
}
portname = portlist[0];

//  Serial port state machine
var state;
var beat;
var on_beat;
var last_beat_time;
var now;

function handleByte(data) {
    //console.log('handleByte:', data);
    if (data & 0x80) state = 1;     // re-sync on protocol errors
    switch(state) {
        case undefined:
            break;
        case 1:
            if (!(data & 0x80)) {   // re-sync on protocol errors
                state = undefined;
                return;
            }
            if (on_beat) {
                if ((data & 0xc0) != 0xc0) {
                    on_beat = false;
                }
            }
            else if ((data & 0xc0) == 0xc0) {
                var now = new Date().getTime();
                if (!last_beat_time) last_beat_time = now;
                else {
                    beat = now - last_beat_time;
                    last_beat_time = now;
                    console.log('beat:', beat);
                    if (argv.url) request.post(argv.url + '/' + beat.toString(), function(err, response) {
                        if (err) console.log(err);
                        //console.log('ok:', response);
                    });
                }
                on_beat = true;
            }
            state = 2;
            break;

        case 2:
        case 3:
        case 4:
            state++;
            break;

        case 5:
            state = 1;
            break;
    }
}

// Open serial port
var SerialPort = require('serialport');
if (portname != 'none') try {
	port = new SerialPort(portname, {
		baudrate: argv.baud,
        parity: 'odd',
		buffersize: 20480
	});
} catch(e) {
	process.stdout.write('Cannot open serial device.');
	process.exit(-2);
}

// serial port beat listener
if (port) port.on('data', function(data) {
    //console.log('serial data:', typeof data, data.length, data, Buffer(data));
    data.forEach(handleByte);
});
