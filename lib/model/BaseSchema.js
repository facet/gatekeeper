var _ = require('underscore'),
  util = require('util');

function MakeBaseSchema(options){

  // var Schema = options.db.Schema;
  CoreSchema = require('facet-core').CoreSchema(options);

  var BaseSchema = function() {
    // options.db.Schema.apply(this, arguments);
    CoreSchema.apply(this, arguments);

    this.methods.cascadeGroups = function(groupIds) {
      // obj to keep progress of group's permissions cascade
      var permsProgress = {};
      // the scope in which current permissions should be cascaded (either 'global' or some app_id)
      var scope = 'global';
      var _this = this;
      var p = new options.db.Promise();

      options.db.models.Group.find({_id: { $in: groupIds }}).exec().then(function(groups){
        // do not assume the order of groups is the same as that of groupIds,
        // explicitly make sure iteration of groups matches order of groupIds
        // for correct permissions cascading
        groups.sort(function(a, b) {
          if( groupIds.indexOf(a._id) < groupIds.indexOf(b._id) ) {
            return -1
          }
          else if( groupIds.indexOf(a._id) > groupIds.indexOf(b._id) ) {
            return 1;
          }
          
          return 0;
        });
        
        for (var i = groups.length - 1; i >= 0; i--) {

          if( scope === 'global' && !_.isEmpty(groups[i].app_id) ) {
            scope = groups[i].app_id;
          }

          // console.log('groups[i] in BaseSchema::cascadeGroups: ', groups[i])

          _this.cascadePermsArr(permsProgress, groups[i].permissions || []);
        };
        
        p.fulfill( {scope: scope, permissions: permsProgress} );
      },
      function(err) {
        p.reject( err );
      })
      .end();

      return p;
    };


    this.methods.cascadePermsArr = function(target, permsArr, override) {
      // console.log('in cascadePermsArr: ');
      // console.log(target);
      // console.log(permsArr);
      // console.log('');

      if( _.isEmpty(override) ) override = false;

      for (var j = permsArr.length - 1; j >= 0; j--) {
        var currAction = permsArr[j].action;
        var currLevel = permsArr[j].level;

        this.cascadeSingle(target, currAction, currLevel, override);
        // console.log('target after cascade single: ', target);
      };
    };

    this.methods.cascadeSingle = function(target, action, level, override) {
      if( _.isEmpty(override) ) override = false;

      if( target.hasOwnProperty(action) && !override ) {
        if( target[action] === 0 && level !== 0 ) {
          target[action] = level;
        }
      }
      else {
        target[action] = level;
      }
    };

    // translate permission level to boolean
    this.methods.levelToBool = function(level) {
      switch( level ) {
        case 1:
          return true;
        case -1:
        case 0:
        case undefined:
        case null:
          return false;
      }
    };

    // strip 0 values from permissions struct
    this.methods.stripInherits = function(target) {

      // console.log('target in stripInherits');
      // console.log(target);
      // console.log('');

      for (var i = 0; i < Object.keys(target).length; i++) {
        var value = Object.keys(target)[i];
        if(_.isNumber(value) && value === 0) {
          delete Object.keys(target)[i];
        }
        else if( _.isObject(value) ) {
          this.stripInherits(value);
        }
      }
    };

  };

  util.inherits(BaseSchema, CoreSchema);

  return BaseSchema;
};



module.exports = exports = MakeBaseSchema;
