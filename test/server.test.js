var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var nock = require('nock');
var NWTHandler = require('../src/server');
var http = require('http');
var assert = require('chai').assert;
var testHelper = require('./testHelper');

describe('NWTHandler', function () {
  context('Proxy Server', function () {

    before(function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      testHelper.initializeDummyLoggers();
      testHelper.initializeDummyHandlers();
      
      NWTHandler.startProxy(constants.NWT_HANDLER_PORT, function (port) {
        done();
      });
    });

    after(function (done) {
      this.timeout = 5000;
      NWTHandler.stopProxy(function () {
        done();
      });
      testHelper.deleteLoggers();
      testHelper.deleteHandlers();
      nock.cleanAll();
    });

    it('Requests on behalf of the client and returns the response', function (done) {
      this.timeout = 5000;
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: constants.NWT_HANDLER_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
      }

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"data":"value"}');
          done();
        });
      });

      request.end();
    });

    it('Requests on behalf of the client via external proxy and returns the response', function (done) {
      this.timeout = 5000;
      testHelper.initializeDummyProxy();
      testHelper.nockProxyUrl(NwtGlobalConfig.proxy, 'http', 'hub', null, 200);
      NWTHandler.generatorForRequestOptionsObject();
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: constants.NWT_HANDLER_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
      }

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"data":"value"}');
          done();
        });
      });

      request.end();
      testHelper.deleteProxy();
    });

    it('Requests on behalf of the client via external proxy and returns the response even if request by tool fails', function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'http');
      NWTHandler.generatorForRequestOptionsObject();
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: constants.NWT_HANDLER_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
      }

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"message":"Error: something terrible. Request Failed At Network Tool","error":"Request Failed At Network Tool"}');
          done();
        });
      });

      request.end();
    });
  });
});
