var chai = require('chai'),
  assert = chai.assert,
  should = chai.should,
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  bootstrap = require('./inc/bootstrap'),
  mongoose = bootstrap.mongoose,
  usersApi = bootstrap.usersApi;

chai.should();
chai.use(sinonChai);


describe('usersApi', function() {

  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('#setupRouterManifest()', function() {
    // check that event is emitted when expected query format is received
    it('should setup router manifest', function(){
      var routes = [
        { verb: 'GET',    route: '/:userId', emit: 'facet:user:findone' },  // GET a single user by id
        { verb: 'GET',    route: '',         emit: 'facet:user:find'    },  // GET an array of user objects 
        { verb: 'POST',   route: '',         emit: 'facet:user:create'  },  // POST new user
        { verb: 'PUT',    route: '/:userId', emit: 'facet:user:update'  },  // PUT single/multiple users
        { verb: 'DELETE', route: '/:userId', emit: 'facet:user:remove'  },  // DELETE a single user resource
      ];

      expect(usersApi.routerManifest.manifest.apiEventType).to.equal('user');
      expect(usersApi.routerManifest.manifest.routeBase).to.equal('/users');
      expect(usersApi.routerManifest.manifest.routes).to.deep.equal(routes);
    });  
  });


  // make sure that listners have been registered
  describe('#registerEvents()', function() {
    it('should register facet:user:find event', function(){
      expect(usersApi.intercom.listenerCount('facet:user:find')).to.equal(1);
    });

    it('should register facet:user:findone event', function(){
      expect(usersApi.intercom.listenerCount('facet:user:findone')).to.equal(1);
    });

    it('should register facet:user:create event', function(){
      expect(usersApi.intercom.listenerCount('facet:user:create')).to.equal(1);
    });

    it('should register facet:user:update event', function(){
      expect(usersApi.intercom.listenerCount('facet:user:update')).to.equal(1);
    });

    it('should register facet:user:remove event', function(){
      expect(usersApi.intercom.listenerCount('facet:user:remove')).to.equal(1);
    });

    it('should register facet:user:findone:auth event', function(){
      expect(usersApi.intercom.listenerCount('facet:user:findone:auth')).to.equal(1);
    });
  });

});
