var Base = require('./BaseSchema');
var User = require('./UserSchema');

function UserModel(options) {
  // util.inherits(User, Base);

  var BaseSchema = new Base(options),
    UserSchema = new User(options, BaseSchema);
  
  var UserModel = options.db.model('User', UserSchema);

  return UserModel;
};


module.exports = UserModel;
