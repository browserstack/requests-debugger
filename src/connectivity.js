var http = require('http');
var url = require('url');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var Utils = require('./utils');
var https = require('https');


var fireRequest = function (requestOptions, requestType, description, successCodes, callback) {
  var httpOrHttps = requestType === 'http' ? http : https;
  var responseData = {
    data: [],
    statusCode: null,
    errorMessage: null,
    description,
    result: 'Failed'
  }

  var request = httpOrHttps.request(requestOptions, function (response) {
    responseData.statusCode = response.statusCode;
    if (successCodes.indexOf(response.statusCode) !== -1) {
      responseData.result = "Passed";
    }

    response.on('data', function (chunk) {
      responseData.data.push(chunk);
    });

    response.on('end', function () {
      responseData.data = Buffer.concat(responseData.data).toString();
      callback(responseData);
    });

  });

  request.on('error', function (err) {
    responseData.errorMessage = err.toString();
    callback(responseData);
  });

  request.setTimeout(constants.CONNECTIVITY_REQ_TIMEOUT, function () {
    request.destroy("Request Timed Out");
  });

  request.end();
}


var ConnectivityChecker = {

  connectionChecks: [],

  reqOpsWithoutProxy: function () {},
  reqOpsWithProxy: function () {},

  httpToHubWithoutProxy: function (callback) {
    var requestUrl = constants.HUB_STATUS_URL;
    var requestOptions = ConnectivityChecker.reqOpsWithoutProxy(requestUrl, 'http');
    fireRequest(requestOptions, 'http', 'HTTP Request To Hub Without Proxy', [200], function (response) {
      callback(response);
    });
  },

  httpToRailsWithoutProxy: function (callback) {
    var requestUrl = constants.RAILS_AUTOMATE;
    var requestOptions = ConnectivityChecker.reqOpsWithoutProxy(requestUrl, 'http');
    fireRequest(requestOptions, 'http', 'HTTP Request To Rails Without Proxy', [200, 301], function (response) {
      callback(response);
    });
  },

  httpsToHubWithoutProxy: function (callback) {
    var requestUrl = constants.HUB_STATUS_URL;
    var requestOptions = ConnectivityChecker.reqOpsWithoutProxy(requestUrl, 'https');
    fireRequest(requestOptions, 'https', 'HTTPS Request To Hub Without Proxy', [200], function (response) {
      callback(response);
    });
  },

  httpsToRailsWithoutProxy: function (callback) {
    var requestUrl = constants.RAILS_AUTOMATE;
    var requestOptions = ConnectivityChecker.reqOpsWithoutProxy(requestUrl, 'https');
    fireRequest(requestOptions, 'https', 'HTTPS Request to Rails Without Proxy', [301, 302], function (response) {
      callback(response);
    });
  },

  httpToHubWithProxy: function (callback) {
    var requestUrl = constants.HUB_STATUS_URL;
    var requestOptions = ConnectivityChecker.reqOpsWithProxy(requestUrl, 'http');
    fireRequest(requestOptions, 'http', 'HTTP Request To Hub With Proxy', [200], function (response) {
      callback(response);
    });
  },

  httpToRailsWithProxy: function (callback) {
    var requestUrl = constants.RAILS_AUTOMATE;
    var requestOptions = ConnectivityChecker.reqOpsWithProxy(requestUrl, 'http');
    fireRequest(requestOptions, 'http', 'HTTP Request To Rails With Proxy', [301], function (response) {
      callback(response);
    });
  },


  decideConnectionChecks: function () {
    if (!ConnectivityChecker.connectionChecks.length) {
      ConnectivityChecker.connectionChecks = [this.httpToHubWithoutProxy, this.httpToRailsWithoutProxy, this.httpsToHubWithoutProxy, this.httpsToRailsWithoutProxy];
      ConnectivityChecker.reqOpsWithoutProxy = function (reqUrl, reqType) {
        var parsedUrl = url.parse(reqUrl);
        var reqOptions = {
          method: 'GET',
          headers: {},
          host: parsedUrl.hostname,
          port: parsedUrl.port || ( reqType === 'http' ? 80 : 443 ),
          path: parsedUrl.path
        }
        return reqOptions;
      }

      if (NwtGlobalConfig.proxy) {
        ConnectivityChecker.connectionChecks.push(this.httpToHubWithProxy, this.httpToRailsWithProxy);
        ConnectivityChecker.reqOpsWithProxy = function (reqUrl, reqType) {
          var parsedUrl = url.parse(reqUrl);
          var reqOptions = {
            method: 'GET',
            headers: {
              'Proxy-Authorization': Utils.proxyAuthToBase64(NwtGlobalConfig.proxy)
            },
            host: NwtGlobalConfig.proxy.host,
            port: NwtGlobalConfig.proxy.port,
            path: parsedUrl.href
          }
          return reqOptions;
        }
      }
    }
  },

  fireChecks: function (topic, uuid, callback) {
    ConnectivityChecker.decideConnectionChecks();
    var totalChecksDone = 0;
    var checksResult = new Array(ConnectivityChecker.connectionChecks.length);
    ConnectivityChecker.connectionChecks.forEach(function (check, index) {
      check(function (checkData) {
        checksResult[index] = checkData;

        if (++totalChecksDone === ConnectivityChecker.connectionChecks.length) {
          checksResult = Utils.beautifyObject(checksResult, "Result Key", "Result Value");
          NwtGlobalConfig.ConnLogger.info(topic, checksResult, false, {}, uuid);
          if (Utils.isValidCallback(callback)) callback();
        }
      });
    });
  }
}

module.exports = ConnectivityChecker;
