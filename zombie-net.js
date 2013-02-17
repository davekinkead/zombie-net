module.exports = (function(){

  // 	Packages
  var _ = require('underscore');
  var Mustache = require('mustache')
  var fs = require('fs')
  var dgram = require('dgram');
  var http = require('http');
  var os = require('os')
  var crypto = require('crypto');

  //	Important zombie variables
  var ips = [];
  var host = '255.255.255.255';
  var port = '27246';
  var adjectives = ['Moaning', 'Hungry', 'Decomposing', 'Green', 'Deathly', 'Evil', 'Nasty', 'Brainless', 'Crazy', 'Horrible', 'Sloppy'];
  var names = ['Bob', 'Katey', 'Harry', 'Pete', 'Dave', 'Sam', 'Eugene', 'Sally', 'Geoff', 'Nigel', 'Anton', 'Ben'];
  var zombieName = adjectives[_.random(adjectives.length-1)] + ' ' + names[_.random(names.length-1)];
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
          var client = info;
          client.present = 1;

          console.log(info.name + " is staking on '" + info.ip + "'");
          ips.push(client);
        } else {
          console.log("Ignoring: '" + info.ip + "'");
          found.present = 1;
          found.resources = info.resources;
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
      info.resources = [];

      // Get list of local resources here.
      var files = fs.readdirSync(__dirname + "/public");

      _.each(files, function(file) {
        var data = fs.readFileSync(__dirname + "/public/" + file);

        var shasum = crypto.createHash('sha1');
        shasum.update(data);
        var sha = shasum.digest('hex');

        info.resources.push({name: file, key: sha});
      });

      var message = new Buffer(JSON.stringify(info));

      server.setBroadcast(true);
      server.send(message, 0, message.length, port, host);

    }, pingTime);

    // Remove all remote clients that we haven't heard from.
    setInterval(function() {

			ips = _.compact(ips);
      _.each(ips, function(ip, i) {
        if (!ip.present) {
          console.log(ip.name + " ate some brains on (ip " + ip.ip + ")");
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
        var resources = [];

        _.each(ips, function(ip) {
          if (ip && ip.resources) {
            _.each(ip.resources, function(resource) {
              if (resource.name[0] != '.') {
                var r = {};
                r.zombie = ip.name;
                r.name = resource.name;
                r.key = resource.key;
                r.ip = ip.ip;
                resources.push(r);
              }
            });
          }
        });

	var view = {ips: ips, resources: resources};
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

  var show = function() {

  };

  return {
    serve: httpServer,
    prowl: prowler
  };
})();
