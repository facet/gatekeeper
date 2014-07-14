var crypto = require('crypto'),
  bcrypt = require('bcrypt'),
  SALT_WORK_FACTOR = 10,
  _ = require('underscore');

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
      application_ids: [{ type: Schema.Types.ObjectId, ref: 'ApplicationSchema' }],
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


  UserSchema.methods.calculatePermissions = function() {

    console.log('in UserSchema::calculatePermissions ', this);
    console.log('');
    console.log('');


    // first cascade groups permissions
    this.groupsCascade = {};

    this.cascadeGroups(this.groups);

    console.log(this.groupsCascade);
    // now cascade user level permissions
  };


  UserSchema.methods.checkAccess = function(action) {
    console.log('in UserSchema::checkAccess', this);
    console.log('');
    console.log('');

    if( !this.calculatedPermissions ) {
      this.calculatePermissions();
      this.calculatedPermissions = true;
    }
    var allow = true;

    return allow;
  };


  // UserSchema.methods.checkAccess = function(action) {
  //   if( !this.calculatedPermissions ) {
  //     this.calculatePermissions();
  //     this.calculatedPermissions = true;
  //   }
  //   var allow = true;


  //   return allow;
  // };

  // UserSchema.methods.calculatePermissions = function() {
  //   // first cascade groups permissions
  //   this.groupsCascade = {};

  //   for (var i = this.groups.length - 1; i >= 0; i--) {

  //     // caculate the current group's cascaded permissions
  //     this.groups[i].cascadePermissions();

  //     for (var j = this.groups[i].permissions.length - 1; j >= 0; j--) {
  //       var currAction = this.groups[i].permissions[j].action;
  //       var currLevel = this.groups[i].permissions[j].level;

  //       // is this permission scoped to an application or global for the container?
  //       if( !_.isEmpty(this.groups[i].app_id) ) {
  //         this.cascadePermission(currAction, currLevel, this.groups[i].app_id);
  //       }
  //       else {
  //         this.cascadePermission(currAction, currLevel);
  //       }
  //     }
  //   }

  //   console.log(this.groupsCascade);
  //   // now cascade user level permissions
  // };

  // UserSchema.methods.cascadePermission = function( action, level, appId ) {
  //   // if an appId is present, scope the cascading permission to it
  //   var scope = 'global'
  //   if( !_.isEmpty(appId) ) {
  //     var scope = appId;
  //   }

  //   if( _.isEmpty(this.groupsCascade[scope]) ) {
  //     this.groupsCascade[scope] = {};
  //   }

  //   if( this.groupsCascade[scope].hasOwnProperty(action) ) {
  //     // if calculated permission for this action is 0 (inherit) or
  //     // -1 (deny) and if this group's level for the same action is
  //     // allow, override the previous cascaded value.
  //     // essentially, allow trumps the over levels
  //     if( this.groupsCascade[scope][action] < 1 && level > 0 ) {
  //       this.groupsCascade[scope][action] = level;
  //     }
  //   }
  //   else {
  //     this.groupsCascade[scope][action] = level;
  //   }
  // };

  return UserSchema;
};



module.exports = exports = UserSchema;
