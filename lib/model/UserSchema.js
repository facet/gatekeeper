var crypto = require('crypto'),
  bcrypt = require('bcrypt'),
  SALT_WORK_FACTOR = 10,
  _ = require('underscore'),
  async = require('async');

function UserSchema(options, BaseSchema){
  var Schema = options.db.Schema;
  
  var UserSchema = new BaseSchema({
    activation_code: String,
    reset_code: String,
    activated: Boolean,
    username: { type: String, index: {unique: true} },
    password: {type: String, required: true},
    birthday: Date,
    lastname: { type: String },
    firstname: { type: String },
    email: { type: String, required: true, index: {unique: true} },
    email2: String,
    email3: String,
    optin_status: Boolean,
    phone: [{
      _id: false,
      type: String,
      number: String
    }],
    fax: [{
      _id: false,
      type: String,
      number: String
    }],
    notes: [{
      _id: false,
      author: { type: Schema.Types.ObjectId, ref: 'UserSchema' },
      note: String,
      date: Date
    }],
    addresses: [{
      _id: false,
      type: String,
      address1: String,
      address2: String,
      region: String,
      zip: String,
      country: String
    }],
    company: String,
    website: String,
    accounts: [{
      _id: false,
      type: String,
      username: String
    }],
    groups: [{
      type: Schema.Types.ObjectId, 
      ref: 'Group'
    }],
    permissions: [{
      _id: false,
      action: String,
      level: Number
    }],
    api_access: Boolean,
    api_key: {type: String, select: false},
    tags: [String],
    custom_data: {},
    created_at: Date,
    updated_at: Date,
    // deleted_at: Date  // soon to allow soft deletes
  });


  UserSchema.pre('save', function(next) {
    // set timestamps
    var now = new Date().toISOString();
    this.created_at = now;
    this.updated_at = now;

    next();
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
    // console.log('candiate pw: ', candidatePassword);
    // console.log('actual pw hash: ', this.password);
    // console.log('cb in comparePassword: ', cb);

    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
    });
  };


  UserSchema.methods.checkAccess = function(action, cb, app_id) {
    if( _.isEmpty(app_id) ) app_id = 'global';
    var _this = this;

    function respond() {
      // console.log('app_id in UserSchema::checkAccess::respond ', app_id);
      // console.log('action in UserSchema::checkAccess::respond ', action);
      // console.log('user app_id: ', _this.app_id);

      // console.log('');
      // console.log('userPermsCascaded for appid '+_this.app_id+':');
      // console.log(_this.userPermsCascaded);

      // console.log('');
      // console.log('groupPermsCascaded for appid '+app_id+':');
      // console.log(_this.groupPermsCascaded[app_id]);
      


      // compare the user's scope and permission against cascaded 
      // groups permission for the current action
      
      // if the user is global (aka container level) and checkAccess is global (aka no app_id passed to checkAccess())
      // in this case user level permission wins if specified, otherwise cascaded group permission wins
      if( _.isEmpty(_this.app_id) && app_id === 'global' ) {
        if( !_.isUndefined(_this.userPermsCascaded[action]) ) {
          cb(_this.levelToBool(_this.userPermsCascaded[action]));
          return;
        }
        else if( !_.isUndefined(_this.userPermsCascaded['*']) ) {
          cb(_this.levelToBool(_this.userPermsCascaded['*']));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded['global'][action]) && _this.groupPermsCascaded['global'][action] !== 0 ){
          cb(_this.levelToBool(_this.groupPermsCascaded['global'][action]));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded['global']['*']) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded['global']['*']));
          return;
        }
        else {
          cb(false);
          return;
        }
      }
      // global user, checkAccess scoped to app_id
      // group cascade for that app_id wins, otherwise user level then global group level has priority
      else if( _.isEmpty(_this.app_id) && app_id !== 'global' ) {
        if( !_.isUndefined(_this.groupPermsCascaded[app_id][action]) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded[app_id][action]));
          return;
        }
        else if( !_.isUndefined(_this.userPermsCascaded[action]) ) {
          cb(_this.levelToBool(_this.userPermsCascaded[action]));
          return;
        }
        else if( !_.isUndefined(_this.userPermsCascaded['*']) ) {
          cb(_this.levelToBool(_this.userPermsCascaded['*']));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded['global'][action]) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded['global'][action]));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded['global']['*']) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded['global']['*']));
          return;
        }
        else {
          cb(false);
          return;
        }
      }
      // app_id scoped user, matching app_id scoped checkAccess
      // user level perm wins, then group perm for that app_id scope then global group perm
      else if( !_.isEmpty(_this.app_id) && _this.app_id === app_id ) {
        if( !_.isUndefined(_this.userPermsCascaded[action]) ) {
          cb(_this.levelToBool(_this.userPermsCascaded[action]));
          return;
        }
        else if( !_.isUndefined(_this.userPermsCascaded['*']) ) {
          cb(_this.levelToBool(_this.userPermsCascaded['*']));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded[app_id][action]) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded[app_id][action]));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded['global'][action]) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded['global'][action]));
          return;
        }
        else if( !_.isUndefined(_this.groupPermsCascaded['*'][action]) ) {
          cb(_this.levelToBool(_this.groupPermsCascaded['*'][action]));
          return;
        }

      }
      // (app_id scoped user, global checkAccess) || (app_id scoped user, non matching app_id scoped checkAcess)
      // not allowed, app_id scoped users are restricted to actions on their app
      else if( (!_.isEmpty(_this.app_id) && app_id === 'global') || (!_.isEmpty(_this.app_id) && _this.app_id !== app_id) ) {
        cb(false);
        return;
      }

      // deny action if permission has not been explicitly allowed
      cb(false);
      return;
    }

    if( !this.calculatedPermissions ) {
      var calc = this.calculatePermissions();
      
      calc.then(function(perms) {
        _this.groupPermsCascaded = perms;
        _this.userPermsCascaded = {};
        // console.log('...calling cascadePermsArr for user permissions...');
        _this.cascadePermsArr(_this.userPermsCascaded, _this.permissions);
        // console.log('...done with cascadePermsArr for users: ', _this.userPermsCascaded);
        _this.stripInherits(_this.userPermsCascaded);
        // console.log('...done with stripInherits for users: ', _this.userPermsCascaded);
        _this.calculatedPermissions = true;
        respond();
      }).end();
    }
    else {
      respond()
    }
  };


  UserSchema.methods.calculatePermissions = function() {
    // first cascade groups permissions
    var _this = this;
    this.groupPermsCascaded = {};
    var p = new options.db.Promise();

    async.forEach(this.groups, function(group, callback) {
      // TODO: check if group is an object vs string (ie query population was used on groups key)

      var lineage = group.path.split('#');
      _this.cascadeGroups(lineage).then(function(result) {
        // merge this groups cascaded permissions
        if( _.isEmpty(_this.groupPermsCascaded[result.scope]) ) {
          _this.groupPermsCascaded[result.scope] = result.permissions;
        }
        else {
          var keys = Object.keys(result.permissions);
          for (var j = 0; j < keys.length; j++) {
            // merge result.permissions[keys[j]] w/ _this.groupPermsCascaded
            var existingPerm = _this.groupPermsCascaded[result.scope][keys[j]];

            if( !_.isEmpty(existingPerm) ) {
              if( result.permissions[keys[j]] == -1 || existingPerm == -1 ) {
                _this.groupPermsCascaded[result.scope][keys[j]] = -1;
              }
            }
            else {
              _this.groupPermsCascaded[result.scope][keys[j]] = result.permissions[keys[j]];
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
      if(err) {
        // TODO: stop exectuion here?
        p.reject(err);
      }

      // strip 0 values out of permissions object
      _this.stripInherits(_this.groupPermsCascaded);
      
      p.fulfill(_this.groupPermsCascaded);
    });

    return p;    
  };

  return UserSchema;
};



module.exports = exports = UserSchema;
