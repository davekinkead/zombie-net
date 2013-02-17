// 	helpers
var _ = require('underscore');
var Mustache = require('mustache')
var fs = require('fs')
var dgram = require('dgram');
var http = require('http');


//	list of local IPs
var ips = [];
var host = '255.255.255.255'

//	create socket
var server = dgram.createSocket('udp4');

//	get local gateway IP & Zombie name
var os = require('os')
var interfaces = os.networkInterfaces();
var addresses = [];
var adjectives = ['Moaning', 'Hungry', 'Decomposing', 'Green', 'Deathly', 'Evil', 'Nasty', 'Brainless', 'Crazy', 'Horrible'];
var names = ['Bob', 'Katey', 'Harry', 'Pete', 'Dave', 'Sam', 'Eugene', 'Sally', 'Geoff', 'Nigel', 'Anton'];
var zombieName = adjectives[_.random(adjectives.length)] + ' ' + names[_.random(names.length)];
for (k in interfaces) {
    for (k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family == 'IPv4' && !address.internal) {
            addresses.push(address.address)
        }
    }
}

//	message event
server.on("message", function (msg, rinfo) {
	console.log('Found: ' + msg);	
	var bits = msg.toString().split(':');
	ips.push({ip: bits[0], name: bits[1]});
	
	//	ensure uniquness
	var keys = [];
	_.each(ips, function() {
		if (_.contains(keys, ips.ip)) {
			ips.pop();
		}
		keys.push(ips.ip);
	});
});

//	start listening
server.on("listening", function () {
	var address = server.address();
	console.log(address);
  console.log("Lstening for IP broadcasts on " + address.address + ":" + address.port);
});


server.bind(2267);

//	broadcast own IP to local network
function broadcast() {
	setTimeout(broadcast, 2000);	
		
	var message = new Buffer(addresses[0] + ':' + zombieName);
	server.setBroadcast(true);
	server.send(message, 0, message.length, 2267, host); 	// 10.10.2.255
}
broadcast();

//	create server and listen on 2268
http.createServer(function(request, response) {
		
	//	add request listner
	request.on('end', function() {
		
		//	view setup
		var view = {ips: ips};
		var template = 'index.html';
		
		//	write response headers
		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		
		//	send respose
		fs.readFile(template, function(err, template) {
			response.end(Mustache.to_html(template.toString(), view));
		});
	});	
	
}).listen(2268);

console.log('Listening for http on localhost:2268');