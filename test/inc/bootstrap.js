var mongoose = require('mongoose'),
  mockgoose = require('Mockgoose'),
  Intercom = require('facet-intercom'),
  auth = require('../../lib/api/Auth'),
  users = require('../../lib/api/Users'),
  groups = require('../../lib/api/Groups');

mockgoose(mongoose);
mongoose.connect( 'mongodb://localhost:27017/facet', { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on( 'error', console.error.bind( console, 'connection error:' ) );

var appOptions = {
  intercom: new Intercom,
  db: mongoose,
  apiSecret: 'SOME_SECRET_STRING'
};

var authApi = new auth(appOptions);
var usersApi = new users(appOptions);
var groupsApi = new groups(appOptions);


module.exports.mongoose = mongoose;
module.exports.authApi = authApi;
module.exports.usersApi = usersApi;
module.exports.groupsApi = groupsApi;
