
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , zombie = require('./zombie-net')
  , publicPath = path.resolve(__dirname, 'public')

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: publicPath }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

mkdirp(publicPath, function(err) {
  if (err) return console.log('Unable to create public path, exiting');

  http.createServer(app).listen(app.get('port'), function(){
    zombie.prowl();
    zombie.serve();
    console.log("Express server listening on port " + app.get('port'));
  });
});
