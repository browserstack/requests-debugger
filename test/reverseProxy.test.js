var constants = require('../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;
var nock = require('nock');
var reverseProxy = require('../src/reverseProxy');
var http = require('http');
var assert = require('chai').assert;
var testHelper = require('./testHelper');

var REVERSE_PROXY_DOMAIN = `http://127.0.0.1:${RdGlobalConfig.RD_HANDLER_REVERSE_PROXY_PORT}`;
var HUB_STATUS_URI_PATH = "/wd/hub/status";

describe('RdHandler', function () {
  context('Reverse Proxy Server', function () {

    before(function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(REVERSE_PROXY_DOMAIN+HUB_STATUS_URI_PATH, 'http', null, 200);
      testHelper.initializeDummyLoggers();
      testHelper.initializeDummyHandlers();
      
      reverseProxy.RdHandler.startServer(RdGlobalConfig.RD_HANDLER_REVERSE_PROXY_PORT, function (port) {
        console.log('Test Network Utility Proxy Started on Port: ', port);
        done();
      });
    });

    after(function (done) {
      this.timeout = 5000;
      reverseProxy.RdHandler.stopServer(function () {
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
        host: '127.0.0.1',
        port: RdGlobalConfig.RD_HANDLER_REVERSE_PROXY_PORT,
        headers: {},
        path: HUB_STATUS_URI_PATH
      };

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

    it('Requests on behalf of the client via external reverse proxy and returns the response', function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(REVERSE_PROXY_DOMAIN+HUB_STATUS_URI_PATH, 'http', null, 200);
      testHelper.initializeDummyProxy();
      testHelper.nockProxyUrl(RdGlobalConfig.proxy, 'http', 'hub', null, 200);
      reverseProxy.RdHandler.generatorForRequestOptionsObject();
      var reqOptions = {
        method: 'GET',
        host: '127.0.0.1',
        port: RdGlobalConfig.RD_HANDLER_REVERSE_PROXY_PORT,
        headers: {},
        path: HUB_STATUS_URI_PATH
      };

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

  });
});
