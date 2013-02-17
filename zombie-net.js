// 	helpers
var _ = require('underscore');

//	list of local IPs
var ips = [];

//	create socket
var dgram = require('dgram');
var server = dgram.createSocket('udp4');

//	get local gateway IP
var os = require('os')
var interfaces = os.networkInterfaces();
var addresses = [];
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
	ips.push({ip: msg+''});
	ips = _.uniq(ips);
});

//	start listening
server.on("listening", function () {
	var address = server.address();
  console.log("Lstening for IP broadcasts on " + address.address + ":" + address.port);
});

server.bind(2267);

//	broadcast own IP to local network
function broadcast() {
	setTimeout(broadcast, 10000);	
		
	var message = new Buffer(addresses[0]);
	server.send(message, 0, message.length, 2267, "localhost");
}
broadcast();

//	create server and listen on 2268
var http = require('http');
var Mustache = require('mustache')

http.createServer(function(request, response) {
		
	//	add request listner
	request.on('end', function() {
			
		//	write response headers
		var view = {ips: ips};
		console.log(ips);
		var template = '<!DOCTYPE html><head></head><body><h1>Camp Net</h1>{{#ips}}<ul><li>{{ip}}</ul>{{/ips}}</body></html>';
		console.log(ips);
		
		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		
		//	send respose
		response.end(Mustache.to_html(template, view));
	});	
	
}).listen(2268);

console.log('Listening for http on localhost:2268');