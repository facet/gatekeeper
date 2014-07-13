var _ = require('underscore'),
  util = require('util'),
  _ = require('underscore');

function MakeBaseSchema(options){

  var Schema = options.db.Schema;

  var BaseSchema = function() {
    options.db.Schema.apply(this, arguments);

    this.add({
      container_id: { type: Schema.Types.ObjectId, ref: 'ContainerSchema' },
      app_id: { type: Schema.Types.ObjectId, ref: 'ApplicationSchema' }
    });

    this.methods.checkAccess = function(action) {

      console.log('in BaseSchema::checkAccess', this);
      console.log('');
      console.log('');

      if( !this.calculatedPermissions ) {
        this.calculatePermissions();
        this.calculatedPermissions = true;
      }
      var allow = true;

      return allow;
    };

    this.methods.calculatePermissions = function() {

      console.log('in BaseSchema::calculatePermissions ', this);
      console.log('');
      console.log('');


      // first cascade groups permissions
      this.groupsCascade = {};

      for (var i = this.groups.length - 1; i >= 0; i--) {

        // caculate the current group's cascaded permissions
        this.groups[i].cascadePermissions();

        for (var j = this.groups[i].permissions.length - 1; j >= 0; j--) {
          var currAction = this.groups[i].permissions[j].action;
          var currLevel = this.groups[i].permissions[j].level;

          // is this permission scoped to an application or global for the container?
          if( !_.isEmpty(this.groups[i].app_id) ) {
            this.cascadePermissions(currAction, currLevel, this.groups[i].app_id);
          }
          else {
            this.cascadePermissions(currAction, currLevel);
          }
        }
      }

      console.log(this.groupsCascade);
      // now cascade user level permissions
    };


    this.methods.cascadePermissions = function( action, level, appId ) {

      console.log('in BaseSchema::cascadePermissions ', this.parent_id);
      console.log('');
      console.log('');
      console.log('');
      console.log('');


      if( _.isEmpty(this.groupsCascade) ) {
        this.groupsCascade = {};
      }

      // if an appId is present, scope the cascading permission to it
      var scope = 'global'
      if( !_.isEmpty(appId) ) {
        var scope = appId;
      }

      if( _.isEmpty(this.groupsCascade[scope]) ) {
        this.groupsCascade[scope] = {};
      }

      if( this.groupsCascade[scope].hasOwnProperty(action) ) {
        // if calculated permission for this action is 0 (inherit) or
        // -1 (deny) and if this group's level for the same action is
        // allow, override the previous cascaded value.
        // essentially, allow trumps the over levels
        if( this.groupsCascade[scope][action] < 1 && level > 0 ) {
          this.groupsCascade[scope][action] = level;
        }
      }
      else {
        this.groupsCascade[scope][action] = level;
      }
    };


  };

  util.inherits(BaseSchema, options.db.Schema);






  // var Schema = options.db.Schema;
  
  // var BaseSchema = new Schema({
  //   container_id: { type: Schema.Types.ObjectId, ref: 'ContainerSchema' },
  //   app_id: { type: Schema.Types.ObjectId, ref: 'ApplicationSchema' }
  // });

  // BaseSchema.virtual('id')
  //   .get(function() {
  //   return this._id.toHexString();
  // });


  // BaseSchema.methods.checkAccess = function(action) {
  //   if( !this.calculatedPermissions ) {
  //     this.calculatePermissions();
  //     this.calculatedPermissions = true;
  //   }
  //   var allow = true;


  //   return allow;
  // };

  // BaseSchema.methods.calculatePermissions = function() {
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

  // BaseSchema.methods.cascadePermission = function( action, level, appId ) {
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

  return BaseSchema;
};



module.exports = exports = MakeBaseSchema;
