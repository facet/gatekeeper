var Schema = require('./GroupSchema');

function GroupModel(options) {
  var GroupSchema = new Schema(options)
    , GroupModel = options.db.model('Group', GroupSchema);

  return GroupModel;
};


module.exports = GroupModel;
