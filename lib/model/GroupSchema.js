function GroupSchema(options, BaseSchema){
  var Schema = options.db.Schema;

  var GroupSchema = new BaseSchema({
      container_id: { type: options.db.Schema.Types.ObjectId, ref: 'ContainerSchema', required: true }
    , app_id: { type: options.db.Schema.Types.ObjectId, ref: 'ApplicationSchema' }
    , parent_id: { type: options.db.Schema.Types.ObjectId, ref: 'GroupSchema' }
    , name: { type: String, required: true, index: {unique: true} }
    , description: String
    , permissions: [{
        _id: false
      , action: String
      , level: Number
    }]
    , custom_data: options.db.Schema.Types.Mixed
    , created_at: Date
    , updated_at: Date
  });

  GroupSchema.pre('save', function(next) {
    var now = new Date().toISOString();
    this.created_at = now;
    this.updated_at = now;
    next();
  });

  return GroupSchema;
};

module.exports = exports = GroupSchema;
