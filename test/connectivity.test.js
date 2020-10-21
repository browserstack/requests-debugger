var ConnectivityChecker = require('../src/connectivity');
var constants = require('../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;
var Utils = require('../src/utils');
var nock = require('nock');
var sinon = require('sinon');
var testHelper = require('./testHelper');

describe('Connectivity Checker for BrowserStack Components', function () {

  before(function () {
    testHelper.initializeDummyLoggers();
  });

  after(function () {
    testHelper.deleteLoggers();
  });

  var resultWithoutProxy = [{
    data: '{"data":"value"}',
    statusCode: 200,
    errorMessage: null,
    description: 'HTTP Request To ' + constants.HUB_STATUS_URL + ' Without Proxy',
    result: 'Passed'
  }, {
    data: '{"data":"value"}',
    statusCode: 301,
    errorMessage: null,
    description: 'HTTP Request To ' + constants.RAILS_AUTOMATE + ' Without Proxy',
    result: 'Passed'
  }, {
    data: '{"data":"value"}',
    statusCode: 200,
    errorMessage: null,
    description: 'HTTPS Request To ' + constants.HUB_STATUS_URL_HTTPS + ' Without Proxy',
    result: 'Passed'
  }, {
    data: '{"data":"value"}',
    statusCode: 302,
    errorMessage: null,
    description: 'HTTPS Request to ' + constants.RAILS_AUTOMATE_HTTPS + ' Without Proxy',
    result: 'Passed'
  }];

  var errorResult = [{
    data: [],
    statusCode: null,
    errorMessage: 'Error: something terrible',
    description: 'HTTP Request To ' + constants.HUB_STATUS_URL + ' Without Proxy',
    result: 'Failed'
  }, {
    data: [],
    statusCode: null,
    errorMessage: 'Error: something terrible',
    description: 'HTTP Request To ' + constants.RAILS_AUTOMATE + ' Without Proxy',
    result: 'Failed'
  }, {
    data: [],
    statusCode: null,
    errorMessage: 'Error: something terrible',
    description: 'HTTPS Request To ' + constants.HUB_STATUS_URL_HTTPS+ ' Without Proxy',
    result: 'Failed'
  }, {
    data: [],
    statusCode: null,
    errorMessage: 'Error: something terrible',
    description: 'HTTPS Request to ' + constants.RAILS_AUTOMATE_HTTPS + ' Without Proxy',
    result: 'Failed'
  }];

  context('without Proxy', function () {
    beforeEach(function () {
      testHelper.deleteProxy();
      ConnectivityChecker.connectionChecks = [];
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      testHelper.nockGetRequest(constants.RAILS_AUTOMATE, 'http', null, 301);
      testHelper.nockGetRequest(constants.RAILS_AUTOMATE, 'https', null, 302);
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      sinon.stub(Utils, 'beautifyObject');

      ConnectivityChecker.fireChecks("some topic", 1, function () {
        sinon.assert.calledOnceWithExactly(Utils.beautifyObject, resultWithoutProxy, "Result Key", "Result Value");
        Utils.beautifyObject.restore();
        done();
      });
    });
  });

  context('with Proxy', function () {
    beforeEach(function () {
      testHelper.initializeDummyProxy();
      ConnectivityChecker.connectionChecks = [];
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      testHelper.nockGetRequest(constants.RAILS_AUTOMATE, 'http', null, 301);
      testHelper.nockGetRequest(constants.RAILS_AUTOMATE, 'http', null, 301);
      testHelper.nockGetRequest(constants.RAILS_AUTOMATE, 'https', null, 302);
      testHelper.nockProxyUrl(RdGlobalConfig.proxy, 'http', 'hub', null, 200);
      testHelper.nockProxyUrl(RdGlobalConfig.proxy, 'http', 'automate', null, 301);
    });

    afterEach(function () {
      nock.cleanAll();
      testHelper.deleteProxy();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      testHelper.nockGetRequest(constants.RAILS_AUTOMATE, 'https', null, 302);
      sinon.stub(Utils, 'beautifyObject');
      var resultWithProxy = resultWithoutProxy.concat([{
        data: '{"data":"value"}',
        description: "HTTP Request To " + constants.HUB_STATUS_URL + " With Proxy",
        errorMessage: null,
        result: "Passed",
        statusCode: 200
      }, {
        data: '{"data":"value"}',
        description: "HTTP Request To " + constants.RAILS_AUTOMATE + " With Proxy",
        errorMessage: null,
        result: "Passed",
        statusCode: 301
      },{
        data: '{"data":"value"}',
        description: "HTTPS Request To " + constants.HUB_STATUS_URL_HTTPS + " With Proxy",
        errorMessage: null,
        result: "Passed",
        statusCode: 200
      }, {
        data: '{"data":"value"}',
        description: "HTTPS Request To " + constants.RAILS_AUTOMATE_HTTPS + " With Proxy",
        errorMessage: null,
        result: "Passed",
        statusCode: 302
      }]);

      ConnectivityChecker.fireChecks("some topic", 1, function () {
        sinon.assert.calledOnceWithExactly(Utils.beautifyObject, resultWithProxy, "Result Key", "Result Value");
        Utils.beautifyObject.restore();
        done();
      });
    });
  });

  // similar case as non error scenario. The only difference is to trigger the 'error' event of request
  // Thus, no need to show it for 'with proxy' case
  context('without Proxy error case', function () {
    beforeEach(function () {
      testHelper.deleteProxy();
      ConnectivityChecker.connectionChecks = [];
      testHelper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'http');
      testHelper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'https');
      testHelper.nockGetRequestWithError(constants.RAILS_AUTOMATE, 'http');
      testHelper.nockGetRequestWithError(constants.RAILS_AUTOMATE, 'https');
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      sinon.stub(Utils, 'beautifyObject');

      ConnectivityChecker.fireChecks("some topic", 1, function () {
        sinon.assert.calledOnceWithExactly(Utils.beautifyObject, errorResult, "Result Key", "Result Value");
        Utils.beautifyObject.restore();
        done();
      });
    });
  });
});
