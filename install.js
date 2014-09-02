var prompt = require('prompt'),
    Users = require('./lib/api/Users'),
    mongoose = require('mongoose'),
    Intercom = require('facet-intercom');

prompt.message = "";
prompt.delimiter = "";
prompt.colors = false;
mongoose.connection.on('error', function(err) {console.log(err)});

var appOptions = {
  intercom: new Intercom(),
  db: mongoose
}

var dbProp = [{     
  name: 'uriString',
  message: 'uriString:',
  validator: /(mongodb):\/\/.+\/.+\??.+$/,
  warning: 'URI String must start with mongodb:// and must /database which will be created if it does not exist'
}];

users = new Users(appOptions);

prompt.start();
printFacet();

dbPrompt(dbProp, function(result) {
  var properties = [
    {
      name: 'username', 
      message: 'username:',
      validator: /^[\_a-zA-Z0-9\-]+$/,
      warning: 'Username must be only letters, numbers, underscores or dashes'
    },
    {
      name: 'email',
      message: 'email:',
      validator: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      warning: 'Please enter a valid e-mail'
    },
    {
      name: 'password',
      message: 'password:',
      hidden: true
    }  
  ];
  prompt.get(properties, function (err, result) {
    if (err) { return onErr(err); }
    apiUserData.username = result.username;
    apiUserData.password = result.password;
    apiUserData.email = result.email;
    dbCreate(apiUserData);
  });

  function onErr(err) {
    console.log(err);
    return 1;
  }
}
);


var apiUserData = {
  api_access: true,
  permissions: [{
    action: '*',
    level: 1
  }]
}

function dbCreate(userObj){
  users.create(userObj).then(
  function(data) {
    console.log('\nUser sucessfully created');
    console.log('username: ' + data.username);
    console.log('password: ' + apiUserData.password);  
    console.log('api_key: ' + data.api_key);
    console.log('\n\nKeep these credentials secure, you will need them for api authentication!');
    process.kill();  
  },
  function(err) {
    console.log('error: ',err);
  }
)
}

function dbPrompt(input, callback){
  prompt.start();
  prompt.get(input, function (err, result) {
    if( result !== undefined ) {
      mongoose.connect(result.uriString,function(err) {
        if (err) {
          console.log('There was an error connecting to mongo:\r\n' + err);
          return dbPrompt(input,callback);
        }
        callback(result.uriString);
        return;
      });
    }
  });
}



function printFacet() {
  console.log('\n');
  console.log('      ___           ___           ___           ___                   ');
  console.log('     /\\__\\         /\\  \\         /\\__\\         /\\__\\                  ');
  console.log('    /:/ _/_       /::\\  \\       /:/  /        /:/ _/_         ___     ');
  console.log('   /:/ /\\__\\     /:/\\:\\  \\     /:/  /        /:/ /\\__\\       /\\__\\    ');
  console.log('  /:/ /:/  /    /:/ /::\\  \\   /:/  /  ___   /:/ /:/ _/_     /:/  /    ');
  console.log(' /:/_/:/  /    /:/_/:/\\:\\__\\ /:/__/  /\\__\\ /:/_/:/ /\\__\\   /:/__/     ');
  console.log(' \\:\\/:/  /     \\:\\/:/  \\/__/ \\:\\  \\ /:/  / \\:\\/:/ /:/  /  /::\\  \\     ');
  console.log('  \\::/__/       \\::/__/       \\:\\  /:/  /   \\::/_/:/  /  /:/\\:\\  \\    ');
  console.log('   \\:\\  \\        \\:\\  \\        \\:\\/:/  /     \\:\\/:/  /   \\/__\\:\\  \\   ');
  console.log('    \\:\\__\\        \\:\\__\\        \\::/  /       \\::/  /         \\:\\__\\  ');
  console.log('     \\/__/         \\/__/         \\/__/         \\/__/           \\/__/  \n');
  console.log('This script will setup a MongoDB user, password and database for you');
  console.log('Please enter your Mongo connection string in standard MongoDB URI format');
  console.log('In the form of: "mongodb://username:password@host:port/database?options..."');
  console.log('');
}

