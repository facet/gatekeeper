var tree = require('mongoose-tree'),
  _ = require('underscore');

function GroupSchema(options, BaseSchema){
  var Schema = options.db.Schema;

  var GroupSchema = new BaseSchema({
      // container_id: { type: options.db.Schema.Types.ObjectId, ref: 'ContainerSchema', required: true }
    // , app_id: { type: options.db.Schema.Types.ObjectId, ref: 'ApplicationSchema' }
    // , predecessors: [{ type: options.db.Schema.Types.ObjectId, ref: 'GroupSchema' }]
    // , parent_id: { type: options.db.Schema.Types.ObjectId, ref: 'GroupSchema' }
    name: { type: String, required: true, index: {unique: true} },
    description: String,
    permissions: [{
        _id: false
      , action: String
      , level: Number
    }],
    custom_data: options.db.Schema.Types.Mixed,
    created_at: Date,
    updated_at: Date
  });

  GroupSchema.plugin(tree);

  GroupSchema.pre('save', function(next, done) {
    // if this is a child, make sure the app_id matches parent's
    if( !_.isEmpty(this.parent_id) && !_.isEmpty(parent.app_id) ) {
      this.collection.findOne({_id: this.parent_id}).select('app_id').exec(function(err, parent) {
        if(err) return next(err);

        if( this.app_id !== parent.app_id ) {
          done(new Error('A child group\'s app_id must match the parent\'s app_id.'))
        }
        else {
          next();
        }
      });
    }

    next();
  });

  GroupSchema.pre('save', function(next) {
    // set timestamps
    var now = new Date().toISOString();
    this.created_at = now;
    this.updated_at = now;

    next();
  });

  return GroupSchema;
};

module.exports = exports = GroupSchema;
