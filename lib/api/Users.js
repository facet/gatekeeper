"use strict";

// load mongoose user model
var _ = require('underscore'),
  User = require('../model/User'),
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

  this.STRIP_FIELDS = {
    GET: ['api_key', 'password'],
    POST: ['api_key', 'access_token'],
    PUT: ['api_key', 'access_token']
  };
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
 * The standard CRUD functions (find, findOne, create, update, remove)
 * are part of FacetApiCore. If you want custom behavior or logic, emit
 * a different event in the routerManifest for the http method in question
 * or bind the existing events to different handers. You'll still be able to invoke
 * the standard CRUD functions from within your custom handler with this.<function name>.
 * See UsersAPI.findOneAuth in this file or FacetApiCore for an example.
 *
 * @return  {void}
 */
UsersAPI.prototype.registerEvents = function () {
  this.intercom.on('facet:user:find', this.find.bind(this) );
  this.intercom.on('facet:user:findone', this.findOne.bind(this) );
  this.intercom.on('facet:user:create', this.create.bind(this) );
  this.intercom.on('facet:user:update', this.update.bind(this) );
  this.intercom.on('facet:user:remove', this.remove.bind(this) );

  // this function is not bound to routes, used only for auth and bypasses usual access checking
  this.intercom.on('facet:user:findone:auth', this.findOneAuth.bind(this) );
};


/**
 * Find one User document with requested fields based on query and options. 
 * !!This function is to be used only for auth as it does no access checking!!
 *
 * @param    {Object}     query       contains fields for conditions, fields, and options
 * @param    {Function}   successCb   custom function for handling success call backs
 * @param    {Function}   errorCb     custom function for handling error call backs
 *
 * @return   {Object}
 */
UsersAPI.prototype.findOneAuth = function(query, successCb, errorCb) {

  // console.log('in UsersAPI@findOneAuth: ', query);

  var _this = this;

  if( query === undefined || query === null || !query.hasOwnProperty('conditions') ) {
    this.intercom.emit('facet:response:error', 400, this.routerManifest.manifest.routeErrorMessages.conditions);
    return this.options.db.Promise.reject(this.routerManifest.manifest.routeErrorMessages.conditions);
  }

  if( query.fields === undefined || query.fields === null ) {
    query.fields = '';
  }

  if( query.options === undefined || query.options === null ) {
    query.options = {};
  }

  if( _.isEmpty(query.options.lean) ) {
    query.options.lean = false;
  }

  var conditions = this.scopeConditions(query.conditions);

  // no need to scope to tenant_id as api_keys are unique to users collection
  var queryBuilder = this.Model.findOne(conditions, query.fields, query.options);
  
  // add in eager loading of sub docs
  if( !_.isEmpty(query.populate) ) {
    if( _.isArray(query.populate) ) {
      for (var i = query.populate.length - 1; i >= 0; i--) {
        queryBuilder.populate(query.populate[i]);
      };
    }
    else {
      queryBuilder.populate(query.populate);
    }
  }

  queryBuilder.exec().then(function(data) {
    successCb(data);
    return data;
  },
  function(err) {
    errorCb(err);
    return null;
  });
};

/**
 * Exports the Users API
 *
 * @type   {Object}
 */
exports = module.exports = UsersAPI;
