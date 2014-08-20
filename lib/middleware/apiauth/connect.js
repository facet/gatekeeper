/*
router specific middlewares need to do the following:
1. emit the appropriate event(s), currently the following are supported:
   - facet:auth:api:jwt
   - facet:auth:api:basic
2. construct a query object with keys for conditions, fields and options
3. construct a nodeStack object with keys for req, res, and next
*/


/**
 * api auth middleware generating function
 * 
 * @param {object} _this - reference to instantiated GatekeeperAPI object
 *
 * @return {function}
 */
exports = module.exports = function(_this) {

  /**
   * connect/express style api auth middleware* 
   *
   * @this <a connect compatible router>
   * @_this GatekeeperAPI
   * 
   * @param {object} req - the node request object
   * @param {object} res - the node response object
   * @param {object} next - the node response object
   *
   * @return {void}
   */
  return function(req, res, next) {
    var nodeStack = {
        req: req,
        res: res,
        next: next
      };

    // _this.nodeStack = nodeStack;
    // all middlewares emit the nodestack just in case it is needed by other modules
    _this.intercom.emit('facet:init:nodestack', nodeStack);

    // check for the type of auth to use
    // apiAuthMethod is a property of GatekeeperAPI
    // if writing your own custom auth middleware and you know the 
    // auth mechanism you'll be using, simply ignore _this switch,
    // construct a query and fire the corresponding event (the possible
    // events are listed in step 1 at the top of _this file)
    switch(_this.apiAuthMethod) {
      case 'jwt':
        var token = (req.body && req.body.access_token) 
          || (req.query && req.query.access_token) 
          || req.headers['x-access-token'];

        if( !token ) {
          _this.intercom.emit('facet:response:error', 403, 'No API token found.');
          return new Error('No API token found.');
        }
          
        var query = {
          token: token
        };

        var authEvent = 'facet:auth:api:jwt';
        break;
      case 'basic':
      default:
        var key = (req.body && req.body.apikey) 
          || (req.query && req.query.apikey) 
          || (req.headers && (req.headers['Authorization'] || req.headers['authorization']));

        if( !key ) {
          _this.intercom.emit('facet:response:error', 403, 'No API key found.');
          return new Error('No API key found.');
        }

        var query = {
          conditions: {
            api_key: key
          }
        };
        var authEvent = 'facet:auth:api:basic';
        break;
    }
    
    // TODO: should the query be scoped to UserSchema.api_access = true to
    // prevent non API accounts from obtaining API tokens?
    

    // emit event to auth user (see lib/api/Users.js for event listner)
    _this.intercom.emit(authEvent, query, nodeStack);
  }
};


  
