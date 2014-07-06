var chai = require('chai'),
  // assert = chai.assert,
  nodeAssert = require('assert'),
  should = chai.should,
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  Intercom = require('facet-intercom'),
  auth = require('../lib/api/Auth');

chai.should();
chai.use(sinonChai);

var appOptions = {
  intercom: new Intercom
};

var AuthAPI = new auth(appOptions);

describe('AuthAPI', function() {
  describe('#apiAuth()', function(done) {

    // check that event is emitted when expected query format is received
    it('should emit a facet:user:findone event', function(){
      var spy = sinon.spy(function(){
        nodeAssert(true, 'event fired successfully');
      }.bind(this));
      
      AuthAPI.intercom.on('facet:user:findone', spy);

      var query = {
        conditions: {api_key: 'abc123'}
      };
      AuthAPI.apiAuth(query);
      expect(spy).to.have.been.called.once;
    });

    // check that response error event is emitted when no query specified
    it('should emit a facet:response:error event', function(){
      var spy = sinon.spy(function(){
        nodeAssert(true, 'event fired successfully');
      }.bind(this));
      
      AuthAPI.intercom.on('facet:response:error', spy);
      AuthAPI.apiAuth();
      expect(spy).to.have.been.called.once;
    });
  });
});