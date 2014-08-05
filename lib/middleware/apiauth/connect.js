/*
router specific middlewares need to do the following:
1. emit the appropriate event(s), currently the following are supported:
   - facet:auth:api:jwt
   - facet:auth:api:basic
2. construct a query object with keys for conditions, fields and options
3. construct a nodeStack object with keys for req, res, and next
*/

/**
 * connect/express style api auth middleware* 
 *
 * @this GatekeeperAPI
 * @param {object} req - the node request object
 * @param {object} res - the node response object
 * @param {object} next - the node response object
 *
 * @return {void}
 */
exports = module.exports = function(req, res, next) {

  var nodeStack = {
      req: req,
      res: res,
      next: next
    };

  this.nodeStack = nodeStack;

  // check for the type of auth to use
  // apiAuthMethod is a property of GatekeeperAPI
  // if writing your own custom auth middleware and you know the 
  // auth mechanism you'll be using, simply ignore this switch,
  // construct a query and fire the corresponding event (the possible
  // events are listed in step 1 at the top of this file)
  switch(this.apiAuthMethod) {
    case 'jwt':
      var token = (req.body && req.body.access_token) 
        || (req.query && req.query.access_token) 
        || req.headers['x-access-token'];

      if( !token ) {
        this.intercom.emit('facet:response:error', 403, 'No API token found.');
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
        this.intercom.emit('facet:response:error', 403, 'No API key found.');
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
  this.intercom.emit(authEvent, query, nodeStack);
}
