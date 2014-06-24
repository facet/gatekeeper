var crypto = require('crypto')
	// , GroupSchema = require('./GroupSchema')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10;

function UserSchema(options){
  var Schema = options.db.Schema;
  

  // TODO: move Container & App schemas to core module
  // var ContainerSchema = new Schema({
  //   'name': String,
  //   'created_at': Date
  // });

  // var ApplicationSchema = new Schema({
  //   'name': String,
  //   'created_at': Date
  // });

  var UserSchema = new Schema({
    container_id: { type: Schema.Types.ObjectId, ref: 'ContainerSchema' },
    app_id: { type: Schema.Types.ObjectId, ref: 'ApplicationSchema' },
    activation_code: String,
    reset_code: String,
    activated: Boolean,
    email: { type: String, required: true, index: {unique: true} },
    email2: String,
    email3: String,
    optin_status: Boolean,
    phone: [{
      type: String,
      number: String
    }],
    username: { type: String, required: true, index: {unique: true} },
    password: {type: String, required: true}

    // 'lastname': { type: String },
    // 'username': { type: String, required: 'The username field is required.' },
    // 'firstname': { type: String },
    // 'salt': String,
    // 'hashed_password': { type: String, required: 'The password field is required.' },
    // 'api_key': String,
    // 'groups': [GroupSchema],
    // 'permissions': { any: [Schema.Types.Mixed] } // contains obj w/ arbitrary # of keys corresponding to resource actions (ie events): { 'product:create': 0, '<storeid>:product:create': 1 }
  });

  UserSchema.virtual('id')
    .get(function() {
    return this._id.toHexString();
  });

  UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) return next(err);

      // hash the password using our new salt
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);

        // override the cleartext password with the hashed one
        user.password = hash;
        next();
      });
    });
  });

  UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
    });
  };

  return UserSchema;
};



module.exports = exports = UserSchema;
