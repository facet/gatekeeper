var chai = require('chai'),
  assert = chai.assert,
  should = chai.should,
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  // chaiAsPromised = require("chai-as-promised"),
  mongoose = require('mongoose'),
  mockgoose = require('Mockgoose'),
  Promise = mongoose.Promise,
  Intercom = require('facet-intercom'),
  Users = require('../lib/api/Users');

chai.should();
chai.use(sinonChai);
// chai.use(chaiAsPromised);

mockgoose(mongoose);
mongoose.connect( 'mongodb://localhost:27017/facet', { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on( 'error', console.error.bind( console, 'connection error:' ) );

var appOptions = { intercom: new Intercom, db: mongoose };
var usersAPI = new Users(appOptions);

describe('UsersAPI', function() {

  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });


  describe('#setupRouterManifest()', function(done) {
    // check that event is emitted when expected query format is received
    it('should setup router manifest', function(done){
      var routes = [
        { verb: 'GET',    route: '/:userId', emit: 'facet:user:findone' },  // GET a single user by id
        { verb: 'GET',    route: '',         emit: 'facet:user:find'    },  // GET an array of user objects 
        { verb: 'POST',   route: '',         emit: 'facet:user:create'  },  // POST new user
        { verb: 'PUT',    route: '/:userId', emit: 'facet:user:update'  },  // PUT single/multiple users
        { verb: 'DELETE', route: '/:userId', emit: 'facet:user:delete'  },  // DELETE a single user resource
      ];

      expect(authAPI.routerManifest.manifest.apiEventType).to.equal('user');
      expect(authAPI.routerManifest.manifest.routeBase).to.equal('/users');
      expect(authAPI.routerManifest.manifest.apiModelId).to.equal('userId');
      expect(authAPI.routerManifest.manifest.routes).to.deep.equal(routes);

      done();
    });  
  });


  // make sure that listners have been registered
  describe('#registerEvents()', function(done) {
    it('should register facet:user:<action> events', function(){
       assert.equal(usersAPI.intercom.listenerCount('facet:user:find'), 1, 'facet:user:find has one listener');
       assert.equal(usersAPI.intercom.listenerCount('facet:user:findone'), 1, 'facet:user:findone has one listener');
       assert.equal(usersAPI.intercom.listenerCount('facet:user:create'), 1, 'facet:user:create has one listener');
       assert.equal(usersAPI.intercom.listenerCount('facet:user:update'), 1, 'facet:user:update has one listener');
       assert.equal(usersAPI.intercom.listenerCount('facet:user:remove'), 1, 'facet:user:remove has one listener');
    });
  });

});
