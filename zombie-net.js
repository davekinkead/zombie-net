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
  var names = ['Bob', 'Katey', 'Harry', 'Pete', 'Dave', 'Sam', 'Eugene', 'Sally', 'Geoff', 'Nigel', 'Anton', 'Ben'];
  var zombieName = adjectives[_.random(adjectives.length)] + ' ' + names[_.random(names.length)];
  var pingTime = 2000;
  var flushTime = 5000;


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

      try {
        var info = JSON.parse(msg);

        var found = _.find(ips, function(ip) {
          return (ip.ip == info.ip);
        });

        if (!found) {
          console.log(info.name + " is staking on '" + info.ip + "'");
          ips.push({ip: info.ip, name: info.name, present: 1});
        } else {
          console.log("Ignoring: '" + info.ip + "'");
          found.present = 1;
        }

      } catch (err) {
        return;
      }
    });

    //	start listening
    server.on("listening", function () {
      var address = server.address();
      console.log(zombieName + " is looking for brains on " + address.address + ":" + address.port);
    });

    server.bind(port);

    //	broadcast own IP to local network
    setInterval(function() {

      var info = {};

      info.name = zombieName;
      info.ip = addresses[0];

      // Get list of local resources here.
      info.resources = [
        { name: "file 1", key: "SHA of file 1" },
        { name: "file 2", key: "SHA of file 2" }
      ];

      var message = new Buffer(JSON.stringify(info));

      server.setBroadcast(true);
      server.send(message, 0, message.length, port, host);

    }, pingTime);

    // Remove all remote clients that we haven't heard from.
    setInterval(function() {

      _.each(ips, function(ip, i) {
        if (!ip.present) {
          console.log(ip.name + " got chewed by a zombie (ip " + ip.ip + ")");
          ips[i] = null;
        } else {
          ip.present = 0;
        }
      });

    }, flushTime);
  };

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
  };

  return {
    serve: httpServer(),
    prowl: prowler(),
  };
})();
