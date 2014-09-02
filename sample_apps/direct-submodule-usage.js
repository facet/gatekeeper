/* This app demonstraties usage of sub gatekeeper submodules directly.
 * In this case the UsersAPI is instantiated and queried directly.
 */

var Users = require('./lib/api/Users'),
  Intercom = require('facet-intercom'),
  mongoose = require('mongoose');

mongoose.connect( 'mongodb://localhost:27017/facet', { server: { socketOptions: { keepAlive: 1 } } });

var intercom = new Intercom();

// at minimum all facet modules require an options object
// containing an 'intercom' key and a 'db' key
var options = {
  intercom: intercom,
  db: mongoose
}

// instantiating the users api module
users = new Users(options);

var p = users.find({});

// query for all users, in this case no callbacks are 
// provided so a promise is returned
users.find({}).then(function(data){
  console.log('got data! ', data);
},
function(err) {
  console.log("got an error :( ", err);
})
.end();

// as an alternative to the promise workflow you could 
// provide success and error callbacks
users.find({}, function(data){
  console.log('success: ', data);
},
function(err) {
  console.log('error: ', data)
});
