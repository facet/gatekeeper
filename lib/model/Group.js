var Base = require('./BaseSchema');
var Group = require('./GroupSchema');

function GroupModel(options) {
  var BaseSchema = new Base(options),
    GroupSchema = new Group(options, BaseSchema);
  
  var GroupModel = options.db.model('Group', GroupSchema);

  return GroupModel;

  // var GroupSchema = new Schema(options)
  //   , GroupModel = options.db.model('Group', GroupSchema);

  // return GroupModel;
};


module.exports = GroupModel;
