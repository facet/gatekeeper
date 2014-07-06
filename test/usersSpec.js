var chai = require('chai'),
  assert = chai.assert,
  should = chai.should,
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  mongoose = require('mongoose'),
  Promise = mongoose.Promise,
  Intercom = require('facet-intercom'),
  Users = require('../lib/api/Users');

chai.should();
chai.use(sinonChai);

mongoose.connect( 'mongodb://localhost:27017/ecapi', { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on( 'error', console.error.bind( console, 'connection error:' ) );

var appOptions = {
  intercom: new Intercom,
  db: mongoose
};

var UsersAPI = new Users(appOptions);

describe('UsersAPI', function() {
  describe('#registerEvents()', function(done) {
    // make sure that listners have been registered
    it('should register facet:user:<action> events', function(){
       assert.equal(UsersAPI.intercom.listenerCount('facet:user:find'), 1, 'facet:user:find has one listener');
       assert.equal(UsersAPI.intercom.listenerCount('facet:user:findone'), 1, 'facet:user:findone has one listener');
       assert.equal(UsersAPI.intercom.listenerCount('facet:user:create'), 1, 'facet:user:create has one listener');
       assert.equal(UsersAPI.intercom.listenerCount('facet:user:update'), 1, 'facet:user:update has one listener');
       assert.equal(UsersAPI.intercom.listenerCount('facet:user:remove'), 1, 'facet:user:remove has one listener');
    });
  });

  describe('#_doResponse()', function(done) {
    // ensure correct response method is invoked
    // method 1 - callbacks
    it('should return correct data when invoking optional success callback', function(done){
      var data = {'id': 'somehash'};

      var successSpy = sinon.spy(function(returnedData) {
        assert.equal(returnedData, data);
        done();
      });

      // var successSpy = sinon.spy();
      var successPromise = new Promise;
      UsersAPI._doResponse('facet:response:user:data', successPromise, successSpy, function(){});
      successPromise.fulfill(data);

      // assert.equal(successSpy.calledWith(data), true);
      // expect(successSpy).to.have.been.called.once;
    });


    // it('should should call the error callback if successCb param is a function', function(){
    //   var errorSpy = sinon.spy();

    //   var errorPromise = new Promise;
    //   UsersAPI._doResponse('facet:response:user:data', errorPromise, function(){}, errorSpy);
    //   errorPromise.error({'message': 'something went wrong'});

    //   expect(errorSpy).to.have.been.called.once;
    // });






    // method 2 - event listener
    // it('should emit an event if no callbacks are passed and if listener exists', function(){
    //   var spy = chai.spy();
    //   UsersAPI.intercom.on('facet:response:user:data', spy);

    //   var p = new Promise;
    //   UsersAPI._doResponse('facet:response:user:data', p);
    //   p.fulfill({'id': 'somehash'});

    //   process.nextTick(function(){
    //     expect(spy).to.have.been.called.once;
    //   });

    //   UsersAPI.intercom.removeListener('facet:response:user:data', spy);
    // });

    // method 3 - returning a promise
    // it('should return a promise if no event listener exists and no success callback was provided', function(){
    //   var p = new Promise;
    //   console.log('count: ', UsersAPI.intercom.listenerCount('facet:response:user:data'));
    //   var result = UsersAPI._doResponse('facet:response:user:data', p, undefined, undefined);

    //   assert.equal(p, result, 'promise was successfully returned');
    // });
  });
});