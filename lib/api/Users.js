
// load mongoose user model
var User = require('../model/User'),
  _ = require('underscore'),
  util = require('util');


/** 
 * API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 *
 * @return void
 */
var UsersAPI = function( options ) {
  this.router = null;
  this.options = options;
  this.intercom = options.intercom;

  // get the user instance
  this.User = new User( this.options );

  this.registerEvents();
}


/** 
 * Registers this API's event listeners
 *
 * @return void
 */
UsersAPI.prototype.registerEvents = function () {
  this.intercom.on('facet:user:find', this.find.bind(this) );
  this.intercom.on('facet:user:findone', this.findOne.bind(this) );
  this.intercom.on('facet:user:create', this.create.bind(this) );
  this.intercom.on('facet:user:update', this.update.bind(this) );
  this.intercom.on('facet:user:remove', this.remove.bind(this) );
};


/**
 * Finds User documents with requested fields based on query and options
 * 
 * @param   query       object   contains fields for conditions, fields, options
 * @param   nodeStack   object   Contains keys for req, res, next
 *
 * @return  promise | void
 */
UsersAPI.prototype.find = function(query, nodeStack, successCb, errorCb) {
  if( typeof query === 'undefined' || query === null ) {
    query = {
      conditions: {}
    };
  }

  if( typeof query.fields === 'undefined' || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {lean: true};
  }

  if( query.hasOwnProperty('id') ) {
    var queryBuilder = this.User.findOne({_id: query.id}, query.fields, query.options);
  }
  else {
    var queryBuilder = this.User.find(query.conditions, query.fields, query.options);
  }

  var promise = queryBuilder.exec();
  var _this = this;

  // if success callback is passed the developer wishes to override the default behavior
  // of emitting intercom events and returning a promise
  if( _.isFunction(successCb) ) {
    promise.then(successCb, errorCb).end();
  }
  // if listner is registered for this event, emit it
  else if( this.intercom.listenerCount('facet:response:user:data') > 0 ) {





    // the problem is that this.intercom.listenerCount('facet:response:user:data') 
    // will always be 0 after the first request because in facet-response 
    // i used this.intercom.once('facet:response:**' ...) instead of .on() in order 
    // to prevent multiple responses from attemping to fire off

    // weirdly enough when calling this._res.json(options.status, data); instead of 
    // directly setting headers + res on this._res object
  






    promise.then(function(data) {
      if( data === null ) {
        _this.intercom.emit('facet:response:error', 404, 'No users match your criteria.');  
      }
      _this.intercom.emit('facet:response:user:data', data, nodeStack);
    },
    function(err) {
      _this.intercom.emit('facet:response:error', 400, err.message);
    }).end();
  }
  // otherwise assume this is custom use of find() and return the promise
  else {
    return promise;
  }

};



/**
 * Finds User documents with requested fields based on query and options
 * 
 * @param   query       object  contains keys for: conditions, fields, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
UsersAPI.prototype.findOne = function(query, nodeStack, successCb, errorCb) {
  if( typeof query === 'undefined' || query === null || !query.conditions ) {
    // TODO: emit error to error handler
    console.log('No query.conditions were specified.');
    process.kill();
  }

  if( typeof query.fields === 'undefined' || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = { lean: true };
  }

// console.log('findone query: ', util.inspect(query));

  var promise = this.User.findOne(query.conditions, query.fields, query.options).exec();

  // if success callback is passed the developer wishes to override the default behavior
  // of emitting intercom events and returning a promise
  if( _.isFunction(successCb) ) {
// console.log('calling successCb in findOne');

    promise.then(successCb, errorCb).end();
  }
  else {
    this.intercom.emit('facet:response:user:data', promise, nodeStack);
    return promise;  
  }
};


/**
 * Updates User documents with requested fields based on query and options
 * 
 * @param   query       object  contains keys for: conditions, updates, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
UsersAPI.prototype.update = function(query, nodeStack) {
  if( typeof query === 'undefined' || query === null || !query.hasOwnProperty('conditions') ) {
    // TODO: emit error to error handler
    console.log('No query conditions were specified.');
    return false;
  }

  if( !query.hasOwnProperty('updates') ) {
    // TODO: emit error to error handler
    console.log('No updates were specified.');
    return false; 
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {};
  }
  
  var promise = this.User.update(query.conditions, query.updates, query.options).exec();
  this.intercom.emit('facet:response:user:update', promise, nodeStack);
  return promise;
};


/**
 * Creates single/multiple Users
 * 
 * @param   data      object | array  either object w/ User properties
 *                                    or array containing such objects
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
UsersAPI.prototype.create = function(data, nodeStack) {
  var promise = this.User.create(data);
  this.intercom.emit('facet:response:user:insert', promise, nodeStack);
  return promise;
};


/**
 * Removes Users that match conditions specified in query
 * 
 * @param   query       object  mongoose query, if {} all Users are deleted
 *
 * @return  promise
 */
UsersAPI.prototype.remove = function(conditions, nodeStack) {
  if( typeof conditions === 'undefined' || conditions === null ) {
    // TODO: emit error to error handler
    console.log('No query conditions were specified.');
    return false;
  }

  var promise = this.User.remove(conditions).exec();
  this.intercom.emit('facet:response:user:remove', promise, nodeStack);
  return promise;
};



/** 
 * Binds groups routes to the provided router instance.
 *
 * @param   Object  router        Router instance (express, koa, custom, etc)
 * @param   Object  routeOptions  Options for route setup.
 *
 * @return void
 */
UsersAPI.prototype.bindRoutes = function( router, routeOptions ) {
  this.router = router;
  var _this = this
    , routeBase = routeOptions.route;

  // GET a single User by id
  this.router.route( routeBase + '/:userId' )
    .get( function ( req, res, next ) {
      var nodeStack = {
          req: req
        , res: res
        , next: next
      };

      var query = {
        id: req.params.userId
      };

      console.log('emitting user find event in UsersAPI ', query);

      _this.intercom.emit('facet:user:find', query, nodeStack);
    });

  // GET an array of User objects by query conditions
  // assumption is that mongoose style stringified query will be passed
  // as a GET param 'q', mongoose options will be passed as 'o' and
  // field names will be 'f'
  //
  // this solution is likely flawed as the resulting URL will be way
  // too long and certain clients or proxies may truncate it
  this.router.route( routeBase )
    .get( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      var query = {
        conditions: JSON.parse(req.query.q) || {},
        fields: JSON.parse(req.query.f) || '',
        options: JSON.parse(req.query.o) || {}
      };

      _this.intercom.emit('facet:user:find', query, nodeStack);
    });

  // POST new User
  this.router.route( routeBase )
    .post( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      _this.intercom.emit("facet:user:create", req.body, nodeStack);
    });


  // PUT single/multiple Users
  // if there is a 'q' GET param, all Users matching 
  // the specified conditions will get updated with the
  // contents of the request body
  this.router.route( routeBase + '/:UserId' )
    .put( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      var UserId = req.params.UserId;
      var query = {
        conditions: {id: UserId},
        updates: req.body.updates,
        fields: req.body.fields
      };

      _this.intercom.emit("facet:user:update", query, nodeStack);
    });


  // DELETE a single resource
  this.router.route( routeBase + '/:UserId' )
    .delete( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      var query = {id: req.params.UserId};

      _this.intercom.emit("facet:user:remove", query, nodeStack);
    });
}


exports = module.exports = UsersAPI;
