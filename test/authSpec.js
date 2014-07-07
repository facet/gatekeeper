var chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  Intercom = require('facet-intercom'),
  auth = require('../lib/api/Auth');

chai.use(sinonChai);

var appOptions = {
  intercom: new Intercom
};

var authAPI = new auth(appOptions);

describe('AuthAPI', function() {
  describe('#apiAuth()', function(done) {

    // check that event is emitted when expected query format is received
    it('should emit a facet:user:findone event', function(done){
      var spy = sinon.spy(function(){
        spy.should.have.have.been.calledOnce;
        authAPI.intercom.removeListener('facet:user:findone', spy);
        done();
      });
      
      authAPI.intercom.on('facet:user:findone', spy);

      var query = {
        conditions: {api_key: 'abc123'}
      };
      authAPI.apiAuth(query);
    });

    // check that response error event is emitted when no query specified
    it('should emit a facet:response:error event', function(done){
      var spy = sinon.spy(function(){
        spy.should.have.have.been.calledOnce;
        done();
      });
      
      authAPI.intercom.on('facet:response:error', spy);
      authAPI.apiAuth();
    });
  });
});