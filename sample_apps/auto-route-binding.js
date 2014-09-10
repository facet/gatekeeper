var env = process.env.NODE_ENV || 'development',
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser');
  http = require('http'),
  mongoose = require('mongoose'),
  Intercom = require('facet-intercom'),
  Gatekeeper = require('facet-gatekeeper'),
  ResponseHandler = require('facet-response-handler');
  
// connect to db
mongoose.connect( 'mongodb://localhost:27017/facet', { server: { socketOptions: { keepAlive: 1 } } });

var appOptions = {
  // mongoose instance is required
  db: mongoose,
  // instantiate event emitter for communication between facet modules
  // intercom uses EE2 for its wildcard event names
  intercom: new Intercom(),
  // doAccessCheck: false, // allow toggling api user access checking for CRUD funcs, even if apiAuthMiddleware() is used
  // apiAuthMethod: 'basic',   // supported values are basic & jwt, basic is default
  // apiSecret: 'SOME_SECRET_STRING',  // optional, used for jwt implementation
  // middlewareType: 'express'  // defines the middleware function format to use for auto route binding
};

// instantiate classes
var gatekeeperApi = new Gatekeeper( appOptions );
var responseHandler = new ResponseHandler( appOptions );

app.use(bodyParser.json());

app.set('port', process.env.PORT || 9393);

// uncomment the following if you'd like to secure your api with appOptions.apiAuthMethod
// app.use( gatekeeperApi.apiAuthMiddleware() );

// init nodeStack, this only needs to be used()'d if the apiAuthMiddleware() is not used
// it emits a facet:nodestack:init with an object containing the current req, res, next
app.use(gatekeeperApi.facetInit());

// The follwing binds GET/POST/PUT/DELETE routes as defined in 
// setupRouterManifest() for each class in /lib/api
// for example:
// GET /api/v1/users
// GET /api/v1/users/:userId
// POST /api/v1/users
// etc...
app.use( '/api/v1', gatekeeperApi.bindRoutes( express.Router(), {
  routes: {
    '/users': 'Users',
    '/groups': 'Groups',
    '/auth': 'Auth'
  }
}));


// start the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
