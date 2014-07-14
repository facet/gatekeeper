// load Group model
var Group = require('../model/Group'),
  _ = require('underscore'),
  Promise = require('promise');
// var GroupSchema = require('../model/GroupSchema');

/** API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 *
 * @return void
 */
var GroupsAPI = function( options ) {
  this.router = null;
  this.options = options;
  this.intercom = options.intercom;

  // get the group model instance
  // this.GroupSchema = GroupSchema;
  this.Group = new Group( this.options );

  this.registerEvents();
}

/** Registers this API's event listeners
 *
 * @return void
 */
GroupsAPI.prototype.registerEvents = function () {
  // TODO: bind listeners
  this.intercom.on('facet:group:find', this.find.bind(this) );
  this.intercom.on('facet:group:create', this.create.bind(this) );
  this.intercom.on('facet:group:child:add', this.addChild.bind(this) );
  this.intercom.on('facet:group:update', this.update.bind(this) );
  this.intercom.on('facet:group:remove', this.remove.bind(this) );
};


/** Binds groups routes to the provided router instance.
 *
 * @param   Object  router        Router instance (express, koa, custom, etc)
 * @param   Object  routeOptions  Options for route setup.
 *
 * @return void
 */
GroupsAPI.prototype.bindRoutes = function( router, routeOptions ) {
  this.router = router;
  var _this = this
    , routeBase = routeOptions.route;

  // GET a single group by id
  this.router.route( routeBase + '/:groupId' )
    .get( function ( req, res, next ) {
      var nodeStack = {
          req: req
        , res: res
        , next: next
      };

      var query = {
        id: groupId
      };
      _this.intercom.emit('facet:group:find', query, nodeStack);
    });

  // GET an array of group objects by query conditions
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

      var query = {};
      // var query = {
      //   conditions: JSON.parse(req.query.q) || {},
      //   fields: JSON.parse(req.query.f) || '',
      //   options: JSON.parse(req.query.o) || {}
      // };

      _this.intercom.emit('facet:group:find', query, nodeStack);
    });

  // POST new group
  this.router.route( routeBase )
    .post( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      _this.intercom.emit("facet:group:create", req.body, nodeStack);
    });


  // PUT single/multiple groups
  // if there is a 'q' GET param, all groups matching 
  // the specified conditions will get updated with the
  // contents of the request body
  this.router.route( routeBase + '/:groupId' )
    .put( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      var groupId = req.params.groupId;
      var query = {
        conditions: {id: groupId},
        updates: req.body.updates,
        fields: req.body.fields
      };

      _this.intercom.emit("facet:group:update", query, nodeStack);
    });


  // DELETE a single resource
  this.router.route( routeBase + '/:groupId' )
    .delete( function ( req, res, next ) {
      var nodeStack = {
        req: req,
        res: res,
        next: next
      };

      var query = {id: req.params.groupId};

      _this.intercom.emit("facet:group:remove", query, nodeStack);
    });
}



/**
 * Finds group documents with requested fields based on query and options
 * 
 * @param   query       object  mongoose query
 * @param   fields      string  which fields to return
 * @param   options     object  mongoose options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
GroupsAPI.prototype.find = function(query, successCb, errorCb) {
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



  if( query.hasOwnProperty('id') ) {
    var queryBuilder = this.Group.findOne({_id: query.id}, query.fields, query.options);
  }
  else {
    var queryBuilder = this.Group.find(query.conditions, query.fields, query.options);
  }

  var promise = queryBuilder.exec();
  var result = this._doResponse('facet:response:user:data', promise, successCb, errorCb);
  
  if( typeof result !== 'undefined' ) {
    return result;
  }
};


/**
 * Finds group documents with requested fields based on query and options
 * 
 * @param   query       object  contains keys for: id, fields, options
 * @param   nodeStack   object  Contains keys for: req, res, next
 *
 * @return  promise
 */
GroupsAPI.prototype.findById = function(query, nodeStack) {
  if( typeof query === 'undefined' || query === null || !query.hasOwnProperty('id') ) {
    // TODO: emit error to error handler
    console.log('No query/id was specified.');
    return false;
  }

  if( typeof query.fields === 'undefined' || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {lean: true};
  }

  var queryBuilder = this.Group.findById(query.id, query.fields, query.options);
  var promise = queryBuilder.exec();

  this.intercom.emit('facet:response:group:data', promise, nodeStack);
  return promise;
};


/**
 * Finds group documents with requested fields based on query and options
 * 
 * @param   query       object  contains keys for: conditions, fields, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
GroupsAPI.prototype.findOne = function(query, nodeStack) {
  if( typeof query === 'undefined' || query === null ) {
    query = {};
  }

  if( typeof fields === 'undefined' || fields === null ) {
    fields = '';
  }

  if( typeof options === 'undefined' || options === null ) {
    options = { lean: false };
  }

  var promise = this.Group.findOne(query, fields, options).exec();
  this.intercom.emit('facet:response:group:data', promise, nodeStack);
  return promise;
};


/**
 * Updates group documents with requested fields based on query and options
 * 
 * @param   query       object  contains keys for: conditions, updates, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
GroupsAPI.prototype.update = function(query, nodeStack) {
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
  
  var promise = this.Group.update(query.conditions, query.updates, query.options).exec();
  this.intercom.emit('facet:response:group:update', promise, nodeStack);
  return promise;
};


/**
 * Creates single/multiple groups
 * 
 * @param   data      object | array  either object w/ group properties
 *                                    or array containing such objects
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  promise
 */
GroupsAPI.prototype.create = function(data, nodeStack) {
  var promise = this.Group.create(data);
  this.intercom.emit('facet:response:group:insert', promise, nodeStack);
  return promise;
};


/**
 * Removes groups that match conditions specified in query
 * 
 * @param   query       object  mongoose query, if {} all groups are deleted
 *
 * @return  promise
 */
GroupsAPI.prototype.remove = function(conditions, nodeStack) {
  if( typeof conditions === 'undefined' || conditions === null ) {
    // TODO: emit error to error handler
    console.log('No query conditions were specified.');
    return false;
  }

  var promise = this.Group.remove(conditions).exec();
  this.intercom.emit('facet:response:group:remove', promise, nodeStack);
  return promise;
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
GroupsAPI.prototype._doResponse = function(fEvent, promise, successCb, errorCb) {
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

  // var queryBuilder = this.Group.findOne({_id: parentId}, '_id predecessors');
  // queryBuilder.exec().then(function(parentGroup){
  //   if( parentGroup === null ) {
  //     this.intercom.emit('facet:response:error', 404, err.message);
  //     return Promise.reject('Parent group not found');
  //   }
    
  //   // make new group
  //   var child = new _this.Group(data);
  //   child.parent = parentGroup;


    
  //   // this.create(data, function(newGroup){
  //   //   _this.intercom.emit('facet:response:group:child:add', newGroup);
  //   //   return Promise.resolve(newGroup);
  //   // },
  //   // function(err) {
  //   //   this.intercom.emit('facet:response:error', 400, err.message);
  //   //   return Promise.reject(err.message);
  //   // });
  // },

  // function(err) {
  //   this.intercom.emit('facet:response:error', 400, err.message);
  //   return Promise.reject(err.message);
  // });
  
};



exports = module.exports = GroupsAPI;
