var nock = require('nock');
var url = require('url');
var constants = require('../config/constants');

// capture a request via the given url and path and return the required status code with data
function nockGetRequest(reqUrl, type, data, statusCode) {
  data = (data && typeof data === 'object') ? data : { "data": "value" };
  type = (['http', 'https'].indexOf(type) !== -1) ? type : 'http';
  try {
    statusCode = parseInt(statusCode);
  } catch (e) {
    statusCode = 200;
  }

  var parsedUrl = url.parse(reqUrl);
  var port = parsedUrl.port;
  port = port || (type === 'http' ? '80' : '443');
  return nock(type + '://' + parsedUrl.hostname + ':' + port)
    .get(parsedUrl.path)
    .reply(statusCode, data);
}

// capture a request which will pass via an upstream proxy and return the desired status code & data
function nockProxyUrl(proxyObj, type, component, data, statusCode) {
  type = ['http', 'https'].indexOf(type) ? type : 'http';
  data = (data && typeof data === 'object') ? data : { "data": "value" };
  try {
    statusCode = parseInt(statusCode);
  } catch (e) {
    statusCode = 200;
  }

  var proxyUrl = type + '://' + proxyObj.host + ':' + proxyObj.port;
  return nock(proxyUrl)
    .get(new RegExp(component))
    .reply(statusCode, data);
}

// capture a request and return error. This gets captured in 'error' event of the request
function nockGetRequestWithError(reqUrl, type) {
  type = (['http', 'https'].indexOf(type) !== -1) ? type : 'http';

  var parsedUrl = url.parse(reqUrl);
  var port = parsedUrl.port;
  port = port || (type === 'http' ? '80' : '443');
  return nock(type + '://' + parsedUrl.hostname + ':' + port)
    .get(parsedUrl.path)
    .replyWithError('something terrible');
}

// Additional Getters and Setters for Initializing/Restoring Dummy Loggers, Handlers & Proxy
function initializeDummyProxy() {
  constants.RdGlobalConfig.proxy = {
    host: "dummyhost12345.com",
    port: "3128",
    username: "user",
    password: "pass"
  };
}

function deleteProxy() {
  delete constants.RdGlobalConfig.proxy;
}

function initializeDummyLoggers() {
  constants.RdGlobalConfig.ConnLogger = {
    info: function () {},
    error: function () {}
  };
  constants.RdGlobalConfig.NetworkLogger = {
    info: function () {},
    error: function () {}
  };
  constants.RdGlobalConfig.MemLogger = {
    info: function () {},
    error: function () {}
  };
  constants.RdGlobalConfig.CPULogger = {
    info: function () {},
    error: function () {}
  };
  constants.RdGlobalConfig.ReqLogger = {
    info: function () {},
    error: function () {}
  };
  constants.RdGlobalConfig.ErrLogger = {
    info: function () {},
    error: function () {}
  };
}

function deleteLoggers() {
  delete constants.RdGlobalConfig.ConnLogger;
  delete constants.RdGlobalConfig.NetworkLogger;
  delete constants.RdGlobalConfig.MemLogger;
  delete constants.RdGlobalConfig.CPULogger;
  delete constants.RdGlobalConfig.ReqLogger;
  delete constants.RdGlobalConfig.ErrLogger;
}

function initializeDummyHandlers() {
  constants.RdGlobalConfig.NetworkLogHandler = function () {};
  constants.RdGlobalConfig.ConnHandler = function () {};
  constants.RdGlobalConfig.CpuLogHandler = function () {};
  constants.RdGlobalConfig.MemLogHandler = function () {};
}

function deleteHandlers() {
  delete constants.RdGlobalConfig.NetworkLogHandler;
  delete constants.RdGlobalConfig.ConnHandler;
  delete constants.RdGlobalConfig.CpuLogHandler;
  delete constants.RdGlobalConfig.MemLogHandler;
}

module.exports = {
  nockGetRequest: nockGetRequest,
  nockProxyUrl: nockProxyUrl,
  nockGetRequestWithError: nockGetRequestWithError,
  initializeDummyProxy: initializeDummyProxy,
  initializeDummyLoggers: initializeDummyLoggers,
  initializeDummyHandlers: initializeDummyHandlers,
  deleteProxy: deleteProxy,
  deleteHandlers: deleteHandlers,
  deleteLoggers: deleteLoggers
};
