var ConnectivityChecker = require('../src/connectivity');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var Utils = require('../src/utils');
var nock = require('nock');
var sinon = require('sinon');
var helper = require('./helper');

describe('Connectivity Checker for BrowserStack Components', function () {
  context('without Proxy', function () {
    beforeEach(function () {
      NwtGlobalConfig.deleteProxy();
      NwtGlobalConfig.initializeDummyLoggers();
      ConnectivityChecker.connectionChecks = [];
      helper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      helper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      helper.nockGetRequest(constants.RAILS_AUTOMATE, 'http', null, 301);
      helper.nockGetRequest(constants.RAILS_AUTOMATE, 'https', null, 302);
    });

    afterEach(function () {
      nock.cleanAll();
      NwtGlobalConfig.deleteLoggers();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      sinon.stub(Utils, 'beautifyObject');

      var result = [{
          data: '{"data":"value"}',
          statusCode: 200,
          errorMessage: null,
          description: 'HTTP Request To Hub Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          statusCode: 301,
          errorMessage: null,
          description: 'HTTP Request To Rails Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          statusCode: 200,
          errorMessage: null,
          description: 'HTTPS Request To Hub Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          statusCode: 302,
          errorMessage: null,
          description: 'HTTPS Request to Rails Without Proxy',
          result: 'Passed'
        }
      ];

      ConnectivityChecker.fireChecks("some topic", 1, function () {
        sinon.assert.calledOnceWithExactly(Utils.beautifyObject, result, "Result Key", "Result Value");
        Utils.beautifyObject.restore();
        done();
      });
    });
  });

  context('with Proxy', function () {
    beforeEach(function () {
      NwtGlobalConfig.initializeDummyProxy();
      NwtGlobalConfig.initializeDummyLoggers();
      ConnectivityChecker.connectionChecks = [];
      helper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      helper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      helper.nockGetRequest(constants.RAILS_AUTOMATE, 'http', null, 301);
      helper.nockGetRequest(constants.RAILS_AUTOMATE, 'https', null, 302);
      helper.nockProxyUrl(NwtGlobalConfig.proxy, 'http', 'hub', null, 200);
      helper.nockProxyUrl(NwtGlobalConfig.proxy, 'http', 'automate', null, 301);
    });

    afterEach(function () {
      nock.cleanAll();
      NwtGlobalConfig.deleteLoggers();
      NwtGlobalConfig.deleteProxy();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      sinon.stub(Utils, 'beautifyObject');

      var result = [{
          data: '{"data":"value"}',
          statusCode: 200,
          errorMessage: null,
          description: 'HTTP Request To Hub Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          statusCode: 301,
          errorMessage: null,
          description: 'HTTP Request To Rails Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          statusCode: 200,
          errorMessage: null,
          description: 'HTTPS Request To Hub Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          statusCode: 302,
          errorMessage: null,
          description: 'HTTPS Request to Rails Without Proxy',
          result: 'Passed'
        }, {
          data: '{"data":"value"}',
          description: "HTTP Request To Hub With Proxy",
          errorMessage: null,
          result: "Passed",
          statusCode: 200
        }, {
          data: '{"data":"value"}',
          description: "HTTP Request To Rails With Proxy",
          errorMessage: null,
          result: "Passed",
          statusCode: 301
        }
      ];

      ConnectivityChecker.fireChecks("some topic", 1, function () {
        sinon.assert.calledOnceWithExactly(Utils.beautifyObject, result, "Result Key", "Result Value");
        Utils.beautifyObject.restore();
        done();
      });
    });
  });

  // similar case as non error scenario. The only difference is to trigger the 'error' event of request
  // Thus, no need to show it for 'with proxy' case
  context('without Proxy error case', function () {
    beforeEach(function () {
      NwtGlobalConfig.deleteProxy();
      NwtGlobalConfig.initializeDummyLoggers();
      ConnectivityChecker.connectionChecks = [];
      helper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'http');
      helper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'https');
      helper.nockGetRequestWithError(constants.RAILS_AUTOMATE, 'http');
      helper.nockGetRequestWithError(constants.RAILS_AUTOMATE, 'https');
    });

    afterEach(function () {
      nock.cleanAll();
      NwtGlobalConfig.deleteLoggers();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      sinon.stub(Utils, 'beautifyObject');

      var result = [{
          data: [],
          statusCode: null,
          errorMessage: 'Error: something terrible',
          description: 'HTTP Request To Hub Without Proxy',
          result: 'Failed'
        }, {
          data: [],
          statusCode: null,
          errorMessage: 'Error: something terrible',
          description: 'HTTP Request To Rails Without Proxy',
          result: 'Failed'
        }, {
          data: [],
          statusCode: null,
          errorMessage: 'Error: something terrible',
          description: 'HTTPS Request To Hub Without Proxy',
          result: 'Failed'
        }, {
          data: [],
          statusCode: null,
          errorMessage: 'Error: something terrible',
          description: 'HTTPS Request to Rails Without Proxy',
          result: 'Failed'
        }
      ];

      ConnectivityChecker.fireChecks("some topic", 1, function () {
        sinon.assert.calledOnceWithExactly(Utils.beautifyObject, result, "Result Key", "Result Value");
        Utils.beautifyObject.restore();
        done();
      });
    });
  });
});
