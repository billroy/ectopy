// ectopy.js
//
// Copyright 2016 by Bill Roy - see LICENSE file
//

function env(key, default_value) {
    return process.env[key] || default_value;
}

// parse command line arguments
var argv = require('yargs')
    .usage('Usage: $0 --port=[3000] --ssl --certs=[~/.certs]')
    .default('port', env('PORT', 3000))
    .default('serialport', '')
    .default('baud', 115200)
    .default('logfile', 'beats.log')
    .default('ssl', env('SSL', false))
    .default('certs', env('CERTS', '~/.certs'))
    .argv;

console.log('ectopy here! v0.1');
console.log(argv);

var async = require('async');
var fs = require('fs');
var request = require('request');
var util = require('util');

// initialize the express app
var express = require('express');
var app = express();
var io;                         // socket.io handle
var router = express.Router();  // router instance for /hx routes
var helmet = require('helmet');
app.use(helmet());              // engage security protections
app.enable('trust proxy');      // configure to support x-forwarded-for header for req.ip

var cookie_secret = '343243sfdjkxvcxvxc3443';
var cookie_signature = require('cookie-signature');
//var cookieParser = require('cookie-parser');
var session = require('express-session');
app.use(session({
    secret: cookie_secret,
    resave: true,               // TODO: confirm this setting
    saveUninitialized: false    // TODO: confirm this setting
}));

var http = require('http');
var https = require('spdy');

// configure json and url-encoded body parsers
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// HTTP basic auth for express 4.0
// via: https://davidbeath.com/posts/expressjs-40-basicauth.html
//
var basicAuth = require('basic-auth');

// api user table seeded with default username and password
var apiUsers = [
    //['username', 'password'],
	[process.env.API_USERNAME || 'entropy',
        process.env.API_PASSWORD || 'heart']
];

function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=entropy-heart');
    return res.sendStatus(401);
}

function authenticate(req, res, next) {
	var user = basicAuth(req);
	if (!user || !user.name || !user.pass) return unauthorized(res);
	for (var u=0; u < apiUsers.length; u++) {
		if ((user.name == apiUsers[u][0]) && (user.pass == apiUsers[u][1])) {
			if (argv.debug) console.log('Authenticated access for user:', user.name);
			return next();
		}
	}
	console.log('Unauthorized access attempt:', user.name, user.pass);
	return unauthorized(res);
}

// serve the static content
if (!argv.no_static) app.use('/', express.static(__dirname + '/public'));

app.post('/beat/:beat', function(req, res) {
    emitBeat(parseInt(req.params.beat));
    return res.sendStatus(200);
});

// configure SSL
var server;
if (argv.ssl) {
	console.log('Configuring SSL...');
	var ssl_key = fs.readFileSync(argv.certs + '/server.key').toString();
	var ssl_cert = fs.readFileSync(argv.certs + '/server.crt').toString();
    server = https.createServer({key: ssl_key, cert: ssl_cert}, app);
}
else server = http.createServer(app);


////////////////////
//
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


////////////////////
//
// Open serial port
//
var SerialPort = require('serialport');
if (portname != 'none') try {
	port = new SerialPort(portname, {
		baudrate: argv.baud,
        parser: SerialPort.parsers.byteDelimiter([10, 13]),
		buffersize: 20480
	});
} catch(e) {
	process.stdout.write('Cannot open serial device.');
	process.exit(-2);
}

// serial port beat listener
if (port) port.on('data', function(data) {
    //console.log('serial data:', typeof data, data.length, data, Buffer(data));
    var line = String.fromCharCode.apply(null, data);
    line = line.replace(/\n/g, '');
    line = line.replace(/\r/g, '');
    //console.log('clean line:', typeof line, line.length, line, Buffer(line));

    if (line.length === 0) return;
    if (line[0] == '#') return;
    var beat = parseInt(line);
    if (isNaN(beat)) return;
    emitBeat(beat);
});

function emitBeat(beat) {
    if (beat < 0 || beat > 3000) return;
    console.log('Emitting beat:', beat);
    sockets.forEach(function(socket) {
        //console.log('emit:', beat);
        socket.emit('beat', beat);
    });

    if (argv.logfile && (argv.logfile != 'none')) {
        logToFile(new Date().toString() + ',' + beat + '\n');
    }
}

function logToFile(text) {
    if (argv.logfile && (argv.logfile != 'none')) {
        fs.appendFile(argv.logfile, text,
                     function(err) {
                        if (err) {
                            console.log('logging error:', argv.logfile, err);
                            argv.logfile = undefined;   // turn off logging on error
                        }
                    });
    }
}


// start the web server
var sockets = [];
var listener = server.listen(argv.port, function() {
    console.log('Server is listening at:', listener.address());

    // start up socket.io
    io = require('socket.io').listen(listener);

    io.sockets.on('connection', function(socket) {
        sockets.push(socket);

        console.log('connect: socket count:', sockets.length);

        socket.on('pong', function(data) {
            console.log('*** Pong:', data);
        });
        socket.on('hello', function(data) {
            console.log('*** Hello:', data);
        });

        socket.on('mark', function(data) {
            console.log('*** Mark:', data);
            logToFile('#' + new Date() + ',### ' + data + '\n');
            io.emit('mark', data);
        });

        socket.on('disconnect', function(which) {
            console.log('disconnect:', which);
            var index = sockets.indexOf(socket);
            if (index >= 0) sockets.splice(index);
            console.log('disconnect: socket count:', sockets.length);
        });

        socket.emit('ping', {time: new Date().getTime()});
    });

});
