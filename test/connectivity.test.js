var url = require('url');
var ConnectivityChecker = require('../src/connectivity');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var Utils = require('../src/utils');
var nock = require('nock');
var sinon = require('sinon');

function getRequestMocker(reqUrl, type, data, statusCode) {
  data = (data && typeof data === 'object') ? data : { "data": "value" };
  type = (['http', 'https'].indexOf(type) !== -1) ? type : 'http';
  try {
    statusCode = parseInt(statusCode);
  } catch (e) {
    statusCode = 200;
  }

  var parsedUrl = url.parse(reqUrl);
  return nock(type + '://' + parsedUrl.hostname)
    .get(parsedUrl.path)
    .reply(statusCode, data);
}

describe('Connectivity Checker for BrowserStack Components', function () {
  context('without Proxy', function () {
    beforeEach(function () {
      getRequestMocker(constants.HUB_STATUS_URL, 'http', null, 200);
      getRequestMocker(constants.HUB_STATUS_URL, 'https', null, 200);
      getRequestMocker(constants.RAILS_AUTOMATE, 'http', null, 301);
      getRequestMocker(constants.RAILS_AUTOMATE, 'https', null, 302);
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it('HTTP(S) to Hub & Rails', function (done) {
      this.timeout(2000);
      sinon.stub(Utils, 'beautifyObject');
      NwtGlobalConfig.deleteProxy();
      NwtGlobalConfig.initializeDummyLoggers();

      var result = [{
          data: '{"data":"value"}',
          statusCode: 200,
          errorMessage: null,
          description: 'HTTP Request To Hub Without Proxy',
          result: 'Passed'
        },
        {
          data: '{"data":"value"}',
          statusCode: 301,
          errorMessage: null,
          description: 'HTTP Request To Rails Without Proxy',
          result: 'Passed'
        },
        {
          data: '{"data":"value"}',
          statusCode: 200,
          errorMessage: null,
          description: 'HTTPS Request To Hub Without Proxy',
          result: 'Passed'
        },
        {
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
});
