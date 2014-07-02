// load Group model
var Group = require('../model/Group');

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

      var query = {
        conditions: JSON.parse(req.query.q) || {},
        fields: JSON.parse(req.query.f) || '',
        options: JSON.parse(req.query.o) || {}
      };

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
GroupsAPI.prototype.find = function(query, nodeStack) {
  if( typeof query === 'undefined' || query === null ) {
    // TODO: emit error to error handler
    console.log('No query was specified.');
    return false;
  }

  if( typeof query.fields === 'undefined' || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === 'undefined' || query.options === null ) {
    query.options = {lean: true};
  }

  if( query.hasOwnProperty('id') ) {
    var queryBuilder = this.Group.findById(query.id, query.fields, query.options);
  }
  else if( query.hasOwnProperty('conditions') ) {
    var queryBuilder = this.Group.find(query.conditions, query.fields, query.options);
  }
  else {
    // TODO: emit error to error handler
    console.log('No conditions or id specified.');
    return false;
  }

  var promise = queryBuilder.exec();

  this.intercom.emit('facet:response:group:data', promise, nodeStack);
  return promise;
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
    options = { lean: true };
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


exports = module.exports = GroupsAPI;
