var url = require('url');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var Utils = require('../src/utils');
var nock = require('nock');
var sinon = require('sinon');
var NWTHandler = require('../src/server');
var http = require('http');
var assert = require('chai').assert;
var helper = require('./helper');

describe('NWTHandler', function () {
  context('Proxy Server', function () {

    before(function (done) {
      this.timeout = 5000;
      helper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      NwtGlobalConfig.initializeDummyLoggers();
      NwtGlobalConfig.initializeDummyHandlers();
      
      NWTHandler.startProxy(constants.NWT_HANDLER_PORT_TEST, function (port) {
        done();
      });
    });

    after(function (done) {
      this.timeout = 5000;
      NWTHandler.stopProxy(function () {
        done();
      });
      NwtGlobalConfig.deleteLoggers();
      NwtGlobalConfig.deleteHandlers();
      nock.cleanAll();
    });

    it('Requests on behalf of the client and returns the response', function (done) {
      this.timeout = 5000;
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: constants.NWT_HANDLER_PORT_TEST,
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
      NwtGlobalConfig.initializeDummyProxy();
      helper.nockProxyUrl(NwtGlobalConfig.proxy, 'http', 'hub', null, 200);
      NWTHandler.generatorForRequestOptionsObject();
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: constants.NWT_HANDLER_PORT_TEST,
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
      NwtGlobalConfig.deleteProxy();
    });

    it('Requests on behalf of the client via external proxy and returns the response even if request by tool fails', function (done) {
      this.timeout = 5000;
      helper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'http');
      NWTHandler.generatorForRequestOptionsObject();
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: constants.NWT_HANDLER_PORT_TEST,
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
