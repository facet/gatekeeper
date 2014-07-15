var _ = require('underscore'),
  util = require('util');

function MakeBaseSchema(options){

  var Schema = options.db.Schema;

  var BaseSchema = function() {
    options.db.Schema.apply(this, arguments);

    this.add({
      container_id: { type: Schema.Types.ObjectId, ref: 'ContainerSchema' },
      app_id: { type: Schema.Types.ObjectId, ref: 'ApplicationSchema' }
    });


    this.methods.cascadeGroups = function(groupIds) {
      this.permsProgress = {};
      this.scope = 'global';
      var _this = this;
      var p = new options.db.Promise();

      options.db.models.Group.find({_id: { $in: groupIds }}).exec().then(function(groups){
        // TODO: do not assume the order fo groups is the same as that of groupIds,
        // explicitly make sure iteration of groups matches order of groupIds
        for (var i = groups.length - 1; i >= 0; i--) {
          if( _this.scope === 'global' && !_.isEmpty(groups[i].app_id) ) {
            _this.scope = groups[i].app_id;
          }

          _this.cascadePermsArr(_this.permsProgress, groups[i].permissions);
        };
        
        p.fulfill( {scope: _this.scope, permissions: _this.permsProgress} );
      },
      function(err) {
        p.reject( err );
      })
      .end();

      return p;
    };


    this.methods.cascadePermsArr = function(target, permsArr, override) {
      if( _.isEmpty(override) ) override = false;

      for (var j = permsArr.length - 1; j >= 0; j--) {
        var currAction = permsArr[j].action;
        var currLevel = permsArr[j].level;

        this.cascadeSingle(target, currAction, currLevel);
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

  };

  util.inherits(BaseSchema, options.db.Schema);

  return BaseSchema;
};



module.exports = exports = MakeBaseSchema;
