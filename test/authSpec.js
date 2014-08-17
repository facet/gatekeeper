var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  Intercom = require('facet-intercom'),
  auth = require('../lib/api/Auth'),
  users = require('../lib/api/Users'),
  mongoose = require('mongoose'),
  mockgoose = require('Mockgoose');

chai.use(sinonChai);
mockgoose(mongoose);
mongoose.connect( 'mongodb://localhost:27017/facet', { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on( 'error', console.error.bind( console, 'connection error:' ) );

var appOptions = {
  intercom: new Intercom,
  db: mongoose,
  apiSecret: 'SOME_SECRET_STRING'
};

var authAPI = new auth(appOptions);
var usersAPI = new users(appOptions);


describe('AuthAPI', function() {

  var sandbox;

  before(function(done){ 
    // insert a user record for auth tests
    var data = { username : 'apiadmin', email: 'apiadmin@woot.com', password : 'change_me', api_key : 'change_me_too', permissions : [ { action : '*', 'level' : 1 } ] };
    usersAPI.create(data, function(data) {
      // console.log('Created test api user.');
      done();
    },
    function(err) {
      console.log(err);
    });
  });

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });


  describe('#setupRouterManifest()', function(done) {
    // check that event is emitted when expected query format is received
    it('should setup router manifest', function(done){
      var routes = [{
        verb: 'POST',
        route: '/account',
        emit: 'facet:auth:login:account'
      },
      {
        verb: 'POST',
        route: '/jwt',
        emit: 'facet:auth:login:jwt'
      }];

      expect(authAPI.routerManifest.manifest.apiEventType).to.equal('auth');
      expect(authAPI.routerManifest.manifest.routeBase).to.equal('/auth');
      expect(authAPI.routerManifest.manifest.routes).to.deep.equal(routes);

      done();
    });  
  });


  // make sure that listners have been registered
  describe('#registerEvents()', function(done) {
    it('should register facet:auth:<action> events', function(done){
      expect(authAPI.intercom.listenerCount('facet:auth:api:basic')).to.equal(1);
      expect(authAPI.intercom.listenerCount('facet:auth:api:jwt')).to.equal(1);
      expect(authAPI.intercom.listenerCount('facet:auth:login:account')).to.equal(1);
      expect(authAPI.intercom.listenerCount('facet:auth:login:jwt')).to.equal(1);

      done();
    });
  });


  describe('#loginJwt', function(done) {
    var query = {
      conditions: {},
      options: {
        lean: false
      },
      fields: '+password'
    };

    beforeEach(function() {
      query.conditions = {};
    });

    // make sure username condition is passed to loginJwt()
    it('should emit a facet:user:findone event with a username condition', function(done) {
      sandbox.findoneSpy = sinon.spy(function(data){
        query.conditions.username = 'coolguy';
        expect(data).to.deep.equal(query);
        authAPI.intercom.removeListener('facet:user:findone', sandbox.findoneSpy);
        done();
      });

      authAPI.intercom.on('facet:user:findone', sandbox.findoneSpy);
      authAPI.loginJwt({username: 'coolguy', password: 'abc123'});
    });

    // make sure email condition is passed to loginJwt()
    it('should emit a facet:user:findone event with an email condition', function(done) {
      sandbox.findoneSpy = sinon.spy(function(data){
        query.conditions.email = 'cool@guy.com';
        expect(data).to.deep.equal(query);
        authAPI.intercom.removeListener('facet:user:findone', sandbox.findoneSpy);
        done();
      });
      authAPI.intercom.on('facet:user:findone', sandbox.findoneSpy);
      authAPI.loginJwt({email: 'cool@guy.com', password: 'abc123'});
    });

    // make sure a user object is returned from loginJwt()
    it('should return a promise that fulfills a token, expires, and user key', function(done) {
      var p = authAPI.loginJwt({username: 'apiadmin', password: 'change_me'});
      
      p.then(function(data) {
        expect(data.user.username).to.equal('apiadmin');
        done();
        },
        function(err) {
          console.log('err: ', err);
        }).end();
    });

    // make sure a expires int is returned from loginJwt()
    it('should return a promise that fulfills a token, expires, and user key', function(done) {
      var p = authAPI.loginJwt({username: 'apiadmin', password: 'change_me'});
      
      p.then(function(data) {
        expect(data.expires).to.exist;
        done();
        },
        function(err) {
          console.log('err: ', err);
        }).end();
    });


    // make sure a token string is returned from loginJwt()
    it('should return a promise that fulfills a token, expires, and user key', function(done) {
      var p = authAPI.loginJwt({username: 'apiadmin', password: 'change_me'});
      
      p.then(function(data) {
        expect(data.token).to.exist;
        done();
        },
        function(err) {
          console.log('err: ', err);
        }).end();
    });
  });

});