var http = require('http');
var constants = require('../config/constants');
var keepAliveAgent = new http.Agent({
  keepAlive: true
});
var RdGlobalConfig = constants.RdGlobalConfig;

var RequestLib = {
  _makeRequest: function (params, clientRequest, retries) {
    return new Promise(function (resolve, reject) {
      var request = http.request(Object.assign({}, params.furtherRequestOptions, {
        agent: keepAliveAgent
      }), function (response) {
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

      
      RdGlobalConfig.ReqLogger.info('Tool Request - Retries Left: ' + retries, clientRequest.method + ' ' + clientRequest.url,
        false,
        params.furtherRequestOptions,
        clientRequest.id);

      request.on('error', function (err) {
        reject({
          message: err,
          customTopic: 'Tool Request - Retries Left: ' + retries
        });
      });

      request.setTimeout(constants.CLIENT_REQ_TIMEOUT, function () {
        request.destroy(constants.REQ_TIMED_OUT);
      });

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
          return RequestLib.call(params, clientRequest, retries - 1, false);
        } else {
          throw err;
        }
      });
  }
};

module.exports = RequestLib;

