var Schema = require('./UserSchema');

function UserModel(options) {
  var UserSchema = new Schema(options)
    , UserModel = options.db.model('User', UserSchema);

  return UserModel;
};


module.exports = UserModel;
