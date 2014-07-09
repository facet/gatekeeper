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

  // ensure correct response method is invoked
  describe('#_doResponse()', function(done) {

    // method 1 - callbacks
    it('should invoke success callback if one is provided', function(done){
      var data = {'id': 'somehash'};
      sandbox.successSpy = sinon.spy(function(data){
        sandbox.successSpy.should.have.been.calledOnce;
        done();  
      });
      var p = new Promise;
      usersAPI._doResponse('facet:response:user:data', p, sandbox.successSpy, function(){});
      p.fulfill(data);
    });


    it('should return correct data when invoking optional success callback', function(done){
      var data = {'id': 'somehash'};

      var successSpy = sinon.spy(function(returnedData) {
        assert.equal(returnedData, data);
        done();
      });

      // var successSpy = sinon.spy();
      var successPromise = new Promise;
      usersAPI._doResponse('facet:response:user:data', successPromise, successSpy, function(){});
      successPromise.fulfill(data);
    });


    // method 2 - event listener
    it('should emit an event if no callbacks are passed and if listener exists', function(done){
      var spy = sinon.spy(function(data){
        expect(spy).to.have.been.called.once;
        usersAPI.intercom.removeListener('facet:response:user:data', spy);
        done();
      });

      usersAPI.intercom.on('facet:response:user:data', spy);

      var p = new Promise;
      usersAPI._doResponse('facet:response:user:data', p);
      p.fulfill({'id': 'somehash'});
    });


    // method 3 - returning a promise
    it('should return a promise if no event listener exists and no success callback was provided', function(){
      var p = new Promise;
      var result = usersAPI._doResponse('facet:response:user:data', p);

      assert.equal(p, result, 'promise was successfully returned');
    });
  });


  describe('#find', function(done) {
    it('should call findOne if a user id was passed', function() {
      var stubFindOne = sandbox.stub(usersAPI.User, 'findOne', function() {
        return {exec: function(){
          return new Promise;
        }};
      });

      usersAPI.find({id: '53b07c1c8e4850ea6ebf22f4'}, function(data){}, function(err){});
      expect(stubFindOne).to.have.been.calledWith({_id: '53b07c1c8e4850ea6ebf22f4'}, '', {});
    });

    it('should call find if no id was specified', function() {
      var stub = sinon.stub(usersAPI.User, 'find', function() {
        return {exec: function(){
          return new Promise;
        }};
      });

      usersAPI.find({conditions: {name: 'The Dude'}}, function(data){}, function(err){});
      expect(stub).to.have.been.calledWith({name: 'The Dude'}, '', {});
    });

    it('should return a promise if no success/error callbacks are passed in', function() {
      var successSpy = sinon.spy(function(data){
        successSpy.should.have.been.calledOnce;
        done();
      });

      var errorSpy = sinon.spy(function(err){
        errorSpy.should.have.been.calledOnce;
        done();
      });

      var result = usersAPI.find( {_id: '53b07c1c8e4850ea6ebf22f4'} );
      result.then(successSpy, errorSpy);
    });
  });

  describe('#find', function(done) {
    // TODO: write function to check return value in case of invalid input
  });

  describe('#findOne', function(done) {
    it('should call findOne on user model if anything was passed into query param', function() {
      var stubFindOne = sandbox.stub(usersAPI.User, 'findOne', function() {
        return {exec: function(){
          return new Promise;
        }};
      });

      usersAPI.find({id: '53b07c1c8e4850ea6ebf22f4'}, function(data){}, function(err){});
      expect(stubFindOne).to.have.been.calledOnce;
    });
  });

  describe('#findOne', function(done) {
    // TODO: write function to check return value in case of invalid input
  });


  describe('#update', function(done) {
    it('should call update on user model if correctly formatted query is passed in', function() {
      var stubUpdate = sandbox.stub(usersAPI.User, 'update', function() {
        return {exec: function(){
          return new Promise;
        }};
      });

      var query = {
        conditions: {_id: '53b07c1c8e4850ea6ebf22f4'},
        updates: {firstname: 'Lorne', lastname: 'Malvo'}
      };
      usersAPI.update(query);
      expect(stubUpdate).to.have.been.calledWith({_id: '53b07c1c8e4850ea6ebf22f4'}, 
        {firstname: 'Lorne', lastname: 'Malvo'}, {});
    });
  });

  describe('#update', function(done) {
    // TODO: write function to check return value in case 
    // query does not contain conditions key
  });

  describe('#update', function(done) {
    // TODO: write function to check return value in case 
    // query does not contain updates key
  });

});
