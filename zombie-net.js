var zombieNet = (function(){

	// 	Packages
	var _ = require('underscore');
	var Mustache = require('mustache')
	var fs = require('fs')
	var dgram = require('dgram');
	var http = require('http');
	var os = require('os')

	//	Important zombie variables
	var ips = [];
	var host = '255.255.255.255';
	var port = '27246';
	var adjectives = ['Moaning', 'Hungry', 'Decomposing', 'Green', 'Deathly', 'Evil', 'Nasty', 'Brainless', 'Crazy', 'Horrible', 'Sloppy'];
	var names = ['Bob', 'Katey', 'Harry', 'Pete', 'Dave', 'Sam', 'Eugene', 'Sally', 'Geoff', 'Nigel', 'Anton'];
	var zombieName = adjectives[_.random(adjectives.length)] + ' ' + names[_.random(names.length)];

	//	get local gateway IP & Zombie name
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
	
	var prowler = function() {
		//	create socket
		var server = dgram.createSocket('udp4');

		//	message event
		server.on("message", function (msg, rinfo) {
			console.log('Found: ' + msg);	
			var bits = msg.toString().split(':');
			ips.push({ip: bits[0], name: bits[1]});
	
			//	ensure uniquness of zombie IPs
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
		  console.log(zombieName + " is looking for brains on " + address.address + ":" + address.port);
		});

		server.bind(port);

		//	broadcast own IP to local network
		function broadcast() {
			setTimeout(broadcast, 10000);	
		
			var message = new Buffer(addresses[0] + ':' + zombieName);
			server.setBroadcast(true);
			server.send(message, 0, message.length, port, host);
		}
		broadcast();
	}

	//	create server and listen on 9876
	var httpServer = function() {
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
		}).listen(9876);

		console.log('Sssshhhh!, There are zombies on localhost:9876');
	}
	
  return {
   serve: httpServer(),
	 prowl: prowler(),
	}
})();