var http = require('http');
var https = require('https');
var constants = require('../config/constants');
var Utils = require('./utils');
var url = require('url');
var HttpProxyAgent = require('http-proxy-agent');
var HttpsProxyAgent = require('https-proxy-agent');

var RdGlobalConfig = constants.RdGlobalConfig;
var httpKeepAliveAgent = new http.Agent({keepAlive: true});
var httpsKeepAliveAgent = new https.Agent({keepAlive: true});
var httpProxyAgent = null;
var httpsProxyAgent = null;
var RequestLib = {

  /**
   * Method to perform the request on behalf of the client
   * @param {schemeObj: Object} schemeObj 
   * @param {{request: Object, furtherRequestOptions: Object}} params 
   * @param {http.IncomingMessage} clientRequest 
   * @param {Number} retries 
   */
  _makeRequest: function (schemeObj, params, clientRequest, retries) {
    return new Promise(function (resolve, reject) {
      var requestOptions = Object.assign({}, params.furtherRequestOptions);
      requestOptions.agent = RdGlobalConfig.SCHEME === 'http' ? httpKeepAliveAgent : httpsKeepAliveAgent;
      if(RdGlobalConfig.proxy) { 
        if (!httpProxyAgent && !httpsProxyAgent) {
          var proxyOpts = url.parse(RdGlobalConfig.proxy.host + ":" +RdGlobalConfig.proxy.port);
          if(RdGlobalConfig.proxy.username && RdGlobalConfig.proxy.password) {
            proxyOpts.auth = RdGlobalConfig.proxy.username + ":" + RdGlobalConfig.proxy.password;
          }
          httpProxyAgent =  HttpProxyAgent(proxyOpts);
          httpsProxyAgent = HttpsProxyAgent(proxyOpts);
        }
        requestOptions.agent = RdGlobalConfig.SCHEME === 'http' ? httpProxyAgent : httpsProxyAgent;  
      }
      var request = schemeObj.request(requestOptions, function (response) {
        var responseToSend = {
          statusCode: response.statusCode,
          headers: response.headers,
          data: []
        };
  
        response.on('data', function (chunk) {
          responseToSend.data.push(chunk);
        });
  
        response.on('end', function () {
          responseToSend.data = Buffer.concat(responseToSend.data).toString();
          resolve(responseToSend);
        });
  
        response.on('error', function (err) {
          reject({
            message: err,
            customTopic: constants.TOPICS.TOOL_RESPONSE_ERROR
          });
        });
      });

      // Log the request that will be initiated on behalf of the client
      request.on('finish', function () {
        var url = RdGlobalConfig.SCHEME + "://" + requestOptions.host + requestOptions.path;
        RdGlobalConfig.reqLogger.info(constants.TOPICS.TOOL_REQUEST_WITH_RETRIES + retries, 
          clientRequest.method + ' ' + url, false, Object.assign({}, params.furtherRequestOptions, {
            data: Buffer.concat(params.request.data).toString()
          }),
          clientRequest.id);
      });

      // Capture any error scenarios while making the request on behalf of the client
      request.on('error', function (err) {
        reject({
          message: err,
          customTopic: constants.TOPICS.TOOL_REQUEST_WITH_RETRIES + retries
        });
      });

      // Set a hard timeout for the request being initiated.
      request.setTimeout(RdGlobalConfig.CLIENT_REQ_TIMEOUT, function () {
        request.destroy(constants.STATIC_MESSAGES.REQ_TIMED_OUT + RdGlobalConfig.CLIENT_REQ_TIMEOUT + ' ms');
      });

      /**
       * If its the first try of the request, set up all the event listeners to capture/collect
       * the data being sent by the client.
       * If its not the first try, then we already have the data to recreate the request
       * if the previous try fails.
       */
      if (retries === constants.MAX_RETRIES) {
        clientRequest.on('data', function (chunk) {
          params.request.data.push(chunk);
          if (!request.write(chunk)) {
            clientRequest.pause();
            request.once('drain', function () {
              clientRequest.resume();
            });
          }
        });
  
        clientRequest.on('error', function (err) {
          request.end();
          reject({
            message: err,
            customTopic: constants.TOPICS.CLIENT_REQUEST_WITH_RETRIES + retries
          });
        });
  
        clientRequest.on('end', function () {
          RdGlobalConfig.reqLogger.info(constants.TOPICS.CLIENT_REQUEST_END, params.request.method + ' ' + requestOptions.path, false, {
            data: Buffer.concat(params.request.data).toString()
          },
          clientRequest.id);
          request.end();
        });
      } else {
        request.write(Buffer.concat(params.request.data));
        request.end();
      }
    });
  },

  /**
   * Handler for performing request. Includes the retry mechanism when request fails.
   * @param {{request: Object, furtherRequestOptions: Object}} params 
   * @param {http.IncomingMessage} clientRequest 
   * @param {Number} retries 
   */
  call: function (params, clientRequest, retries) {
    retries = (typeof retries === 'number') ? Math.min(constants.MAX_RETRIES, Math.max(retries, 0)) : constants.MAX_RETRIES;
    var schemeObj = RdGlobalConfig.SCHEME === "http" ? http : https;
    return RequestLib._makeRequest(schemeObj, params, clientRequest, retries)
      .catch(function (err) {
        var errTopic = err.customTopic || constants.TOPICS.UNEXPECTED_ERROR;
        // Collect Network & Connectivity Logs whenever a request fails
        RdGlobalConfig.networkLogHandler(errTopic, clientRequest.id);
        RdGlobalConfig.connHandler(errTopic, clientRequest.id);

        if (retries > 0) {
          RdGlobalConfig.reqLogger.error(errTopic, clientRequest.method + ' ' + clientRequest.url,
            false, {
              errorMessage: err.message.toString()
            },
            clientRequest.id);

          return Utils.delay(RdGlobalConfig.RETRY_DELAY)
            .then(function () {
              return RequestLib.call(params, clientRequest, retries - 1, false);
            });
        } else {
          throw err;
        }
      });
  }
};

module.exports = RequestLib;
