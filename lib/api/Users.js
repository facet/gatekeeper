
// load mongoose user model
var User = require('../model/User'),
  _ = require('underscore'),
  util = require('util'),
  Promise = require('promise');


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
 * @param   query       object    contains fields for conditions, fields, options
 * @param   successCb   function  Custom function for handling CRUD succeess
 * @param   errorCb     function  Custom function for handling CRUD error
 *
 * @return  void
 */
UsersAPI.prototype.find = function(query, successCb, errorCb) {
  if( typeof query === 'undefined' || query === null ) {
    query = {
      conditions: {}
    };
  }

  if( typeof query.fields === 'undefined' || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {};
  }

  // query.options.lean = false;

  if( query.hasOwnProperty('id') ) {
    var queryBuilder = this.User.findOne({_id: query.id}, query.fields, query.options);
  }
  else {
    var queryBuilder = this.User.find(query.conditions, query.fields, query.options);
  }

  var promise = queryBuilder.exec();
  var result = this._doResponse('facet:response:user:data', promise, successCb, errorCb);
  
  if( typeof result !== 'undefined' ) {
    return result;
  }
};



/**
 * Finds User documents with requested fields based on query and options
 * 
 * @param   query       object    contains keys for: conditions, fields, options
 * @param   successCb   function  Custom function for handling CRUD succeess
 * @param   errorCb     function  Custom function for handling CRUD error
 *
 * @return  void
 */
UsersAPI.prototype.findOne = function(query, successCb, errorCb) {
  if( typeof query === 'undefined' || query === null ) {
    this.intercom.emit('facet:response:error', 400, 'No query conditions were specified');
    return Promise.reject('No query conditions were specified');
  }
  
  if( typeof query.fields === 'undefined' || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {};
  }

  // query.options.lean = false;

  var promise = this.User.findOne(query.conditions, query.fields, query.options).exec();
  var result = this._doResponse('facet:response:user:data', promise, successCb, errorCb);

  if( typeof result !== 'undefined' ) {
    return result;
  }
};


/**
 * Updates User documents with requested fields based on query and options
 * 
 * @param   query       object  contains keys for: conditions, updates, options
 * @param   successCb   function  Custom function for handling CRUD succeess
 * @param   errorCb     function  Custom function for handling CRUD error
 *
 * @return  void
 */
UsersAPI.prototype.update = function(query, successCb, errorCb) {
  // if( typeof query === 'undefined' || query === null || !query.hasOwnProperty('conditions') ) {
  //   this.intercom.emit('facet:response:error', 400, 'No query conditions were specified');
  // }
  // else {
  //   if( !query.hasOwnProperty('updates') ) {
  //     this.intercom.emit('facet:response:error', 400, 'No updates were specified');
  //   }
  //   else {
  //     if( typeof query.options === 'undefined' || query.options === null ) {
  //       query.options = {};
  //     }
      
  //     var promise = this.User.update(query.conditions, query.updates, query.options).exec();
  //     this._doResponse('facet:response:user:update', promise, successCb, errorCb);      
  //   }
  // }

  if( typeof query === 'undefined' || query === null || !query.hasOwnProperty('conditions') ) {
    this.intercom.emit('facet:response:error', 400, 'No query conditions were specified');
    return Promise.reject('No query conditions were specified');
  }

  if( !query.hasOwnProperty('updates') ) {
    this.intercom.emit('facet:response:error', 400, 'No updates were specified');

    // TODO return rejected promise
    return;
  }
  
  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {};
  }
  
  var promise = this.User.update(query.conditions, query.updates, query.options).exec();
  var result = this._doResponse('facet:response:user:update', promise, successCb, errorCb);

  if( typeof result !== 'undefined' ) {
    return result;
  }
};


/**
 * Creates single/multiple Users
 * 
 * @param   data      object | array  either object w/ User properties
 *                                    or array containing such objects
 * @param   successCb   function  Custom function for handling CRUD succeess
 * @param   errorCb     function  Custom function for handling CRUD error
 *
 * @return  void
 */
UsersAPI.prototype.create = function(data, successCb, errorCb) {
  if( !data || _.isEmpty(data) ) {
    this.intercom.emit('facet:response:error', 400, 'No data supplied for creating new user');
    return Promise.reject('No data supplied for creating new user');
  }

  var promise = this.User.create(data);
  var result = this._doResponse('facet:response:user:create', promise, successCb, errorCb);

  if( typeof result !== 'undefined' ) {
    return result;
  }
};


/**
 * Removes Users that match conditions specified in query
 * 
 * @param   query       object  mongoose query, if {} all Users are deleted
 * @param   successCb   function  Custom function for handling CRUD succeess
 * @param   errorCb     function  Custom function for handling CRUD error
 *
 * @return  void
 */
UsersAPI.prototype.remove = function(conditions, successCb, errorCb) {
  if( typeof conditions === 'undefined' || conditions === null ) {
    this.intercom.emit('facet:response:error', 400, 'No conditions specified for remove operation.');
    return Promise.reject('No conditions specified for remove operation');
  }

  var promise = this.User.remove(conditions).exec();
  var result = this._doResponse('facet:response:user:remove', promise, successCb, errorCb);

  if( typeof result !== 'undefined' ) {
    return result;
  }
};


/**
 * Executes a response for a given event. Determines how the data/error should
 * be handled. IF a success callback is passed, that trumps all other methods as 
 * the user wants to override the flow with their own custom logic. Otherwise if 
 * the current event has any listeners registered for it on intercom, the event is 
 * emitted. Finally if none of those are true, a promise is returned so the user 
 * can interact with it however they see fit.
 * 
 * @param   fEvent      string    The current event
 * @param   promise     promise   A promise for performing a CRUD operation
 * @param   successCb   function  Custom function for handling CRUD succeess
 * @param   errorCb     function  Custom function for handling CRUD error
 *
 * @return  promise | void
 */
UsersAPI.prototype._doResponse = function(fEvent, promise, successCb, errorCb) {
  var _this = this;

  // console.log(promise);

  if( _.isFunction(successCb) ) {
    promise.then(successCb, errorCb);
    // promise.then(undefined, undefined);
  }
  else if( this.intercom.listenerCount(fEvent) > 0 ) {
    promise.then(function(data) {
      // console.log('data after "successful" '+fEvent+' operation: ', data);
      // TODO: add more checks for failure to complete operation
      if( data === null ) {
        _this.intercom.emit('facet:response:error', 404, 'No users match your criteria.');  
      }
      else {
        _this.intercom.emit(fEvent, data);  
      }
    },
    function(err) {
      _this.intercom.emit('facet:response:error', 400, err.message);
    });
    // .end();
  }
  else {
    return promise;
  }
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
      var query = {
        id: req.params.userId
      };

      console.log('emitting user find event in UsersAPI ', query);

      _this.intercom.emit('facet:user:find', query);
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
      var query = {
        conditions: JSON.parse(req.query.q) || {},
        fields: JSON.parse(req.query.f) || '',
        options: JSON.parse(req.query.o) || {}
      };

      _this.intercom.emit('facet:user:find', query);
    });

  // POST new User
  this.router.route( routeBase )
    .post( function ( req, res, next ) {
      _this.intercom.emit("facet:user:create", req.body);
    });


  // PUT single/multiple Users
  // if there is a 'q' GET param, all Users matching 
  // the specified conditions will get updated with the
  // contents of the request body
  this.router.route( routeBase + '/:userId' )
    .put( function ( req, res, next ) {
      var UserId = req.params.userId;
      var query = {
        conditions: {id: userId},
        updates: req.body.updates,
        fields: req.body.fields
      };

      _this.intercom.emit("facet:user:update", query);
    });


  // DELETE a single resource
  this.router.route( routeBase + '/:userId' )
    .delete( function ( req, res, next ) {
      var query = {id: req.params.userId};

      _this.intercom.emit("facet:user:remove", query);
    });
}


exports = module.exports = UsersAPI;
