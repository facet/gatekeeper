"use strict";

// load mongoose user model
var User = require('../model/User'),
  util = require('util'),
  ApiCore = require('facet-core').ApiCore;


/** 
 * API constructor
 *
 * @param   {Object}  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 *
 * @return  {void}
 */
var UsersAPI = function( options ) {
  // set the options
  // this.setCommonAttributes( options );

  UsersAPI.super_.call(this, options);

  // set the model
  this.Model = new User( this.options );

  // set the router for automation
  this.setupRouterManifest();

  // register the api events
  this.registerEvents();
};

/**
 * Users API inherits from Core API
 */
util.inherits(UsersAPI, ApiCore);


/**
 * Sets up the router manifest for route automation
 *
 * @return   {void}
 */
UsersAPI.prototype.setupRouterManifest = function () {

  // update the router manifest 
  this.routerManifest
    .setApiEventType('user')
    .setApiModelId('userId')
    .setRouteBase('/users')
    .setRoutes([
      { verb: 'GET',    route: '/:userId', emit: 'facet:user:findone' },  // GET a single user by id
      { verb: 'GET',    route: '',         emit: 'facet:user:find'    },  // GET an array of user objects 
      { verb: 'POST',   route: '',         emit: 'facet:user:create'  },  // POST new user
      { verb: 'PUT',    route: '/:userId', emit: 'facet:user:update'  },  // PUT single/multiple users
      { verb: 'DELETE', route: '/:userId', emit: 'facet:user:remove'  },  // DELETE a single user resource
    ])
    .extendRouteErrorMessages({
      container: 'The API user does not have a valid container id.',
      conditions: 'No query conditions were specified',
      query: 'Error querying for user(s): ',
      notFound: 'No user was found.',
      find: 'No user(s) matched your criteria.',
      findOne: 'No user matched your criteria.',
      update: 'No updates were specified.',
      updateMatch: 'No products were updated based on your criteria.',
      create: 'No data supplied for creating new user.',
      createMatch: 'No user was created based on your criteria.',
      remove: 'No data supplied for removing user.',
      removeMatch: 'No user was removed based on your criteria.'
    });
};


/** 
 * Registers this API's event listeners. Note that the CRUD functions
 * bound here are part of the facet core module in the FacetApiCore class
 *
 * @return  {void}
 */
UsersAPI.prototype.registerEvents = function () {
  this.intercom.on('facet:user:find', this.find.bind(this) );
  this.intercom.on('facet:user:findone', this.findOne.bind(this) );
  this.intercom.on('facet:user:create', this.create.bind(this) );
  this.intercom.on('facet:user:update', this.update.bind(this) );
  this.intercom.on('facet:user:remove', this.remove.bind(this) );
};


/**
 * Exports the Users API
 *
 * @type   {Object}
 */
exports = module.exports = UsersAPI;
