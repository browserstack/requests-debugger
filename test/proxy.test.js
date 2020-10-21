var constants = require('../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;
var nock = require('nock');
var RdHandler = require('../src/proxy');
var http = require('http');
var assert = require('chai').assert;
var testHelper = require('./testHelper');


describe('RdHandler', function () {
  context('Proxy Server with http scheme', function () {
    var originalScheme;
    before(function (done) {
      this.timeout = 5000;
      testHelper.initializeDummyLoggers();
      testHelper.initializeDummyHandlers();
      testHelper.initializeDummyProxy();
      originalScheme = RdGlobalConfig.SCHEME;
      RdGlobalConfig.SCHEME = 'http';

      RdHandler.startProxyServer(RdGlobalConfig.RD_HANDLER_PROXY_PORT, function (port) {
        console.log('Test Network Utility Proxy Server Started on Port: ', port);
        done();
      });
    });

    after(function (done) {
      this.timeout = 5000;
      RdHandler.stopProxyServer(function () {
        done();
      });
      testHelper.deleteLoggers();
      testHelper.deleteHandlers();
      nock.cleanAll();
      RdGlobalConfig.SCHEME = originalScheme;
    });

    it('Requests on behalf of the client and returns the response', function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: RdGlobalConfig.RD_HANDLER_PROXY_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
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

    it('Requests on behalf of the client via external proxy and returns the response', function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'http', null, 200);
      testHelper.initializeDummyProxy();
      testHelper.nockProxyUrl(RdGlobalConfig.proxy, 'http', 'hub', null, 200);
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: RdGlobalConfig.RD_HANDLER_PROXY_PORT,
        headers: {},
        path: "http://user1:pass1@" + constants.HUB_HOST + constants.HUB_STATUS_PATH
      };

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"data":"value"}');
          done();
          testHelper.deleteProxy();
        });
      });
      request.end();
    });

    it('Requests on behalf of the client via external proxy and returns the response even if request by tool fails', function (done) {
      this.timeout = 5000;
      for (var i = 0; i <= constants.MAX_RETRIES; i++) {
        testHelper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'http');
      }
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: RdGlobalConfig.RD_HANDLER_PROXY_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
      };

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"message":"Error: something terrible. Request Failed At Requests Debugger","error":"Request Failed At Requests Debugger"}');
          done();
        });
      });

      request.end();
    });
  });

  context('Proxy Server with https scheme', function () {
    var originalScheme;
    before(function (done) {
      this.timeout = 5000;
      testHelper.initializeDummyLoggers();
      testHelper.initializeDummyHandlers();
      testHelper.initializeDummyProxy();
      originalScheme = RdGlobalConfig.SCHEME;
      RdGlobalConfig.SCHEME = 'https';

      RdHandler.startProxyServer(RdGlobalConfig.RD_HANDLER_PROXY_PORT, function (port) {
        console.log('Test Network Utility Proxy Server Started on Port: ', port);
        done();
      });
    });

    after(function (done) {
      this.timeout = 5000;
      RdHandler.stopProxyServer(function () {
        done();
      });
      testHelper.deleteLoggers();
      testHelper.deleteHandlers();
      nock.cleanAll();
      RdGlobalConfig.SCHEME.restore();
      RdGlobalConfig.SCHEME = originalScheme;
    });

    it('Requests on behalf of the client and returns the response', function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: RdGlobalConfig.RD_HANDLER_PROXY_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
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

    it('Requests on behalf of the client via external proxy and returns the response', function (done) {
      this.timeout = 5000;
      testHelper.nockGetRequest(constants.HUB_STATUS_URL, 'https', null, 200);
      testHelper.initializeDummyProxy();
      testHelper.nockProxyUrl(RdGlobalConfig.proxy, 'https', 'hub', null, 200);
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: RdGlobalConfig.RD_HANDLER_PROXY_PORT,
        headers: {},
        path: "http://user1:pass1@" + constants.HUB_HOST + constants.HUB_STATUS_PATH
      };

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"data":"value"}');
          done();
          testHelper.deleteProxy();
        });
      });
      request.end();
    });

    it('Requests on behalf of the client via external proxy and returns the response even if request by tool fails', function (done) {
      this.timeout = 5000;
      for (var i = 0; i <= constants.MAX_RETRIES; i++) {
        testHelper.nockGetRequestWithError(constants.HUB_STATUS_URL, 'https');
      }
      var reqOptions = {
        method: 'GET',
        host: 'localhost',
        port: RdGlobalConfig.RD_HANDLER_PROXY_PORT,
        headers: {},
        path: constants.HUB_STATUS_URL
      };

      var responseData = [];
      var request = http.request(reqOptions, function (response) {

        response.on('data', function (chunk) {
          responseData.push(chunk);
        });

        response.on('end', function () {
          assert(Buffer.concat(responseData).toString() === '{"message":"Error: something terrible. Request Failed At Requests Debugger","error":"Request Failed At Requests Debugger"}');
          done();
        });
      });

      request.end();
    });
  });
});
