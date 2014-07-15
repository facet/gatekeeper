var crypto = require('crypto'),
  bcrypt = require('bcrypt'),
  SALT_WORK_FACTOR = 10,
  _ = require('underscore'),
  async = require('async');

function UserSchema(options, BaseSchema){
  var Schema = options.db.Schema;
  
  var UserSchema = new BaseSchema({
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
    password: {type: String, required: true, select: false},
    groups: [{
      type: Schema.Types.ObjectId, 
      ref: 'Group'
    }],
    permissions: [{
      _id: false,
      // app_ids: [{ type: Schema.Types.ObjectId, ref: 'ApplicationSchema' }],
      action: String,
      level: Number
    }],
    api_key: {type: String, select: false}

    // 'lastname': { type: String },
    // 'username': { type: String, required: 'The username field is required.' },
    // 'firstname': { type: String },
    // 'salt': String,
    // 'hashed_password': { type: String, required: 'The password field is required.' },
    
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


  UserSchema.methods.checkAccess = function(action, cb) {
    // console.log('in UserSchema::checkAccess');
    // console.log('');
    // console.log('');

    if( !this.calculatedPermissions ) {
      var calc = this.calculatePermissions();
      
      calc.then(function(perms) {
        this.calculatedPermissions = true;

        console.log('permsCascaded in UserSchema::checkAccess');
        console.log(perms);

        // perform check for 'action' and return
        
        var allow = true;

        cb(allow);
      }).end();
    }
  };


  UserSchema.methods.calculatePermissions = function() {
    // first cascade groups permissions
    var _this = this;
    this.permsCascaded = {};
    var p = new options.db.Promise();

    async.forEach(this.groups, function(group, callback) {
      var lineage = group.path.split('#');
      _this.cascadeGroups(lineage).then(function(result) {
        console.log(result);

        // merge this groups cascaded permissions
        if( _.isEmpty(_this.permsCascaded[result.scope]) ) {
          _this.permsCascaded[result.scope] = result.permissions;
        }
        else {
          var keys = Object.keys(result.permissions);
          for (var j = 0; j < keys.length; j++) {
            // merge result.permissions[keys[j]] w/ _this.permsCascaded
            var existingPerm = _this.permsCascaded[result.scope][keys[j]];
            if( (!_.isEmpty(existingPerm) && existingPerm == 0) || _.isEmpty(existingPerm) ) {
              _this.permsCascaded[result.scope][keys[j]] = result.permissions[keys[j]];
            }
          };
        }

        // tell async this group's task has finished
        callback();
      })
      .end();
    },

    // final callback for async 
    function(err) {
      if(err) p.reject(err);

      // now cascade user level permissions
      // if the user has an app_id, scope the cascade accordingly
      if( !_.isEmpty(_this.app_id) && !_.isEmpty(_this.permsCascaded[_this.app_id]) ) {
        // merge w/ app_id permissions
        _this.cascadePermsArr(_this.permsCascaded[_this.app_id], _this.permissions, true);
      }
      else if( !_.isEmpty(_this.app_id) ) { 
        _this.permsCascaded[_this.app_id] = {};
        _this.cascadePermsArr(_this.permsCascaded[_this.app_id], _this.permissions, true);
      }
      else {
        // merge w/ global permissions
        _this.cascadePermsArr(_this.permsCascaded[_this.app_id], _this.permissions, true); 
      }

      p.fulfill(_this.permsCascaded);
    });

    return p;    
  };

  return UserSchema;
};



module.exports = exports = UserSchema;
