"use strict";
var Group = require('../model/Group'),
  util = require('util'),
  ApiCore = require('facet-core').ApiCore;

/** API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 *
 * @return void
 */
var GroupsAPI = function( options ) {
  // set the options
  // this.setCommonAttributes( options );

  GroupsAPI.super_.call(this, options);
  
  // set the model
  this.Model = new Group( this.options );

  // set the router for automation
  this.setupRouterManifest();

  // register the api events
  this.registerEvents();
}


/**
 * Groups API inherits from Core API
 */
util.inherits(GroupsAPI, ApiCore);



/**
 * Sets up the router manifest for route automation
 *
 * @return   {void}
 */
GroupsAPI.prototype.setupRouterManifest = function () {

  // update the router manifest 
  this.routerManifest
    .setApiEventType('group')
    .setApiModelId('groupId')
    .setRouteBase('/groups')
    .setRoutes([
      { verb: 'GET',    route: '/:groupId', emit: 'facet:group:findone' },  // GET a single group by id
      { verb: 'GET',    route: '',            emit: 'facet:group:find'    },  // GET an array of group objects 
      { verb: 'POST',   route: '',            emit: 'facet:group:create'  },  // POST new group
      { verb: 'PUT',    route: '/:groupId', emit: 'facet:group:update'  },  // PUT single/multiple groups
      { verb: 'DELETE', route: '/:groupId', emit: 'facet:group:remove'  },  // DELETE a single group resource
    ])
    .extendRouteErrorMessages({
      container: 'The API user does not have a valid container id.',
      conditions: 'No query conditions were specified',
      query: 'Error querying for group(s): ',
      notFound: 'No group was found.',
      find: 'No group(s) matched your criteria.',
      findOne: 'No group matched your criteria.',
      update: 'No updates were specified.',
      updateMatch: 'No groups were updated based on your criteria.',
      create: 'No data supplied for creating new group.',
      createMatch: 'No group was created based on your criteria.',
      remove: 'No data supplied for removing group.',
      removeMatch: 'No group was removed based on your criteria.'
    });
};



/** Registers this API's event listeners
 *
 * @return void
 */
GroupsAPI.prototype.registerEvents = function () {
  // TODO: bind listeners
  this.intercom.on('facet:group:find', this.find.bind(this) );
  this.intercom.on('facet:group:findone', this.findOne.bind(this) );
  this.intercom.on('facet:group:create', this.create.bind(this) );
  this.intercom.on('facet:group:child:add', this.addChild.bind(this) );
  this.intercom.on('facet:group:update', this.update.bind(this) );
  this.intercom.on('facet:group:remove', this.remove.bind(this) );
};




GroupsAPI.prototype.addChild = function(parentId, data, successCb, errorCb) {
  // var _this = this;

  // console.log('in GroupsAPI::addChild');

  var child = new this.Group(data);
  child.parent = this.options.db.Types.ObjectId(parentId);
  var promise = child.save();

  // console.log(promise);

  var result = this._doResponse('facet:response:group:child:add', promise, successCb, errorCb);

  if( typeof result !== 'undefined' ) {
    return result;
  }
};


/**
 * Exports the GroupsAPI
 *
 * @type   {Object}
 */
exports = module.exports = GroupsAPI;
