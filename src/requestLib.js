var http = require('http');
var constants = require('../config/constants');
var Utils = require('./utils');
var keepAliveAgent = new http.Agent({
  keepAlive: true
});
var RdGlobalConfig = constants.RdGlobalConfig;

var RequestLib = {
  /**
   * Method to perform the request on behalf of the client
   * @param {{request: Object, furtherRequestOptions: Object}} params 
   * @param {http.IncomingMessage} clientRequest 
   * @param {Number} retries 
   */
  _makeRequest: function (params, clientRequest, retries) {
    return new Promise(function (resolve, reject) {
      var requestOptions = Object.assign({}, params.furtherRequestOptions, {
        agent: keepAliveAgent
      });

      // Adding a custom header for usage and debugging purpose at BrowserStack
      requestOptions.headers['X-Requests-Debugger'] = clientRequest.id;

      // Initialize the request to be fired on behalf of the client
      var request = http.request(requestOptions, function (response) {
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
      });

      // Log the request that will be initiated on behalf of the client
      request.on('finish', function () {
        RdGlobalConfig.ReqLogger.info('Tool Request - Retries Left: ' + retries, clientRequest.method + ' ' + clientRequest.url,
          false,
          Object.assign({}, params.furtherRequestOptions, {
            data: Buffer.concat(params.request.data).toString()
          }),
          clientRequest.id);
      });

      // Capture any error scenarios while making the request on behalf of the client
      request.on('error', function (err) {
        reject({
          message: err,
          customTopic: 'Tool Request - Retries Left: ' + retries
        });
      });

      // Set a hard timeout for the request being initiated.
      request.setTimeout(constants.CLIENT_REQ_TIMEOUT, function () {
        request.destroy(constants.REQ_TIMED_OUT);
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
            customTopic: 'Request - Retries Left: ' + retries
          });
        });
  
        clientRequest.on('end', function () {
          RdGlobalConfig.ReqLogger.info("Request End", params.request.method + ' ' + params.request.url, false, {
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
    return RequestLib._makeRequest(params, clientRequest, retries)
      .catch(function (err) {
        if (retries > 0) {
          RdGlobalConfig.ReqLogger.error(err.customTopic, clientRequest.method + ' ' + clientRequest.url,
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

