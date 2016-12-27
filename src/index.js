var http = require('https');
var AlexaSkill = require('./AlexaSkill');
var particleConfig = require('./device.json');

/*
 *
 * Particle is a child of AlexaSkill.
 *
 */
var Particle = function () {
	AlexaSkill.call(this, particleConfig.appId);
};

particleConfig.deviceids = parseDeviceIds(particleConfig.devices);

// Extend AlexaSkill
Particle.prototype = Object.create(AlexaSkill.prototype);
Particle.prototype.constructor = Particle;

Particle.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
	console.log("Particle onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
};

Particle.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
	console.log("Particle onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
	var speechOutput = "Welcome to the Particle Demo, you can ask me what is the temperature or humidity. You can also tell me to turn on Red or Green light.";

	response.ask(speechOutput);
};

Particle.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
	console.log("Particle onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
};

Particle.prototype.intentHandlers = {
	// register custom intent handlers
	SetBrightness: function (intent, session, response) {
		var brightnessSlot = intent.slots.Brightness;
		var roomSlot = intent.slots.Room;

		var rawBrightness = brightnessSlot ? brightnessSlot.value : 10;
		var percentBrightness = Math.max(0, Math.min(100, rawBrightness));
		var brightness = Math.round((percentBrightness / 100) * 255);

		var room = roomSlot ? roomSlot.value : '';

		var deviceids = particleConfig.deviceids;
		var roomDeviceId = particleConfig.devices[room];

		if (roomDeviceId) {
			deviceids = [roomDeviceId];
		}

		console.log("Brightness: " + brightness);
		console.log(`Room: ${room} (${roomDeviceId})`);

		setBrightness(deviceids, brightness, () => {
			response.tell('Okay, set brightness to ' + percentBrightness + ' percent');
		});
	},
	SetMode: function (intent, session, response) {
		var modeSlot = intent.slots.Mode;
		var roomSlot = intent.slots.Room;

		var mode = modeSlot ? modeSlot.value : 'christmas';

		var room = roomSlot ? roomSlot.value : '';

		var deviceids = particleConfig.deviceids;
		var roomDeviceId = particleConfig.devices[room];

		if (roomDeviceId) {
			deviceids = [roomDeviceId];
		}

		console.log("Mode: " + mode);
		console.log(`Room: ${room} (${roomDeviceId})`);

		setMode(deviceids, mode, () => {
			response.tell('Okay, set mode to ' + mode);
		});
	},
	SetColor: function (intent, session, response) {
		var colorSlot = intent.slots.Color;
		var roomSlot = intent.slots.Room;

		var color = colorSlot ? colorSlot.value : 'blue';

		var room = roomSlot ? roomSlot.value : '';

		var deviceids = particleConfig.deviceids;
		var roomDeviceId = particleConfig.devices[room];

		if (roomDeviceId) {
			deviceids = [roomDeviceId];
		}

		console.log("Color: " + color);
		console.log(`Room: ${room} (${roomDeviceId})`);

		setColor(deviceids, color, () => {
			response.tell('Okay, set color to ' + color);
		});
	},
	'AMAZON.HelpIntent': function (intent, session, response){
		response.tell('You can ask me to set the mode, brightness or color.');
	}
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
	// Create an instance of the Particle skill.
	var particleSkill = new Particle();
	particleSkill.execute(event, context);
};

function setBrightness(deviceids, brightness, callback) {
	var count = 0;
	deviceids.forEach(deviceid => {
		var path = "/v1/devices/" + deviceid + "/setBright";
		console.log("Path: " + path);

		makeParticleRequest(path, brightness, resp => {
			count++;
			if (count === deviceids.length) {
				callback();
			}
		});
	});
}

function setMode(deviceids, mode, callback) {
	var count = 0;
	if (mode.toLowerCase() == "christmas") {
		mode = "xmas";
	}
	deviceids.forEach(deviceid => {
		var path = "/v1/devices/" + deviceid + "/setMode";
		console.log("Path: " + path);

		makeParticleRequest(path, mode, resp => {
			count++;
			if (count === deviceids.length) {
				callback();
			}
		});
	});
}

function setColor(deviceids, color, callback) {
	var count = 0;
	var val = '0 0 255';

	switch (color) {
		case 'red':
			val = '255 0 0';
			break;
		case 'green':
			val = '0 255 0';
			break;
		case 'blue':
			val = '0 0 255';
			break;
		case 'purple':
			val = '255 0 255';
			break;
		case 'white':
			val = '255 255 255';
			break;
		case 'yellow':
			val = '255 255 0';
			break;
		case 'orange':
			val = '255 100 0';
			break;
	}

	deviceids.forEach(deviceid => {
		var path = "/v1/devices/" + deviceid + "/setRGB";
		console.log("Path: " + path);

		makeParticleRequest(path, val, resp => {
			count++;
			if (count === deviceids.length) {
				callback();
			}
		});
	});
}

function makeParticleRequest(urlPath, args, callback) {
	// Particle API parameters
	var options = {
		hostname: "api.particle.io",
		port: 443,
		path: urlPath,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': '*.*',
			'Authorization': 'Bearer ' + particleConfig.accessToken
		}
	}

	var postData = "args=" + args;

	console.log("Post Data: " + postData);

	// Call Particle API
	var req = http.request(options, function (res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));

		var body = "";

		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk);

			body += chunk;
		});

		res.on('end', function () {
			callback(body);
		});
	});

	req.setTimeout(2000, () => {
		console.log('Timed out connecting: ' + urlPath);
		callback();
		req.abort();
	});

	req.on('error', function (e) {
		console.log('problem with request: ' + e.message);
		callback();
	});

	// write data to request body
	req.write(postData);
	req.end();
}

function parseDeviceIds(devices) {
	var deviceids = {};
	Object.keys(devices).forEach(name => {
		var deviceid = devices[name];
		deviceids[deviceid] = true;
	});
	return Object.keys(deviceids);
}