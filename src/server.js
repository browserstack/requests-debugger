/**
 * Server to Intercept the client's requests and handle them on their behalf.
 * Initiates stats and connectivity checks when a requests fails.
 * It also responds in selenium understandable error when a request fails
 * at tool.
 */

var http = require('http');
var url = require('url');
var uuidv4 = require('uuid/v4');
var Utils = require('./utils');
var constants = require('../config/constants');
var ReqLib = require('./requestLib');

var RdGlobalConfig = constants.RdGlobalConfig;

var RdHandler = {

  _requestCounter: 0,

  /**
   * Generates the request options for firing requests
   * @param {http.IncomingMessage} clientRequest
   * @param {String} serverType 
   * @returns {Object}
   */
  _generateRequestOptions: function (clientRequest, serverType) {
    var requestOptions = {
      headers: {}
    };
    var parsedClientUrl = url.parse(clientRequest.url);
    requestOptions.host = parsedClientUrl.host;
    requestOptions.port = RdGlobalConfig.SCHEME == 'http' ? 80 : 443;
    requestOptions.path = parsedClientUrl.path;
    requestOptions.method = clientRequest.method;
    requestOptions.headers = clientRequest.headers;
    if(serverType == constants.SERVER_TYPES.REVERSE_PROXY){
      requestOptions.host = constants.HUB_HOST;
      requestOptions.headers.host = constants.HUB_HOST;
    }
    requestOptions.headers['X-Requests-Debugger'] =  clientRequest.id;
    if (parsedClientUrl.auth) {
      requestOptions.headers['Authorization'] = Utils.proxyAuthToBase64(parsedClientUrl.auth);
    }
    return requestOptions;
  },

  /**
   * Frames the error response based on the type of request.
   * i.e., if its a request originating for Hub, the response
   * is in the format which the client binding would understand.
   * @param {Object} parsedRequest 
   * @param {String} errorMessage 
   */
  _frameErrorResponse: function (parsedRequest, errorMessage) {
    errorMessage += '. ' + constants.STATIC_MESSAGES.REQ_FAILED_MSG;
    var parseSessionId = parsedRequest.path.match(/\/wd\/hub\/session\/([a-z0-9]+)\/*/);
    if (parseSessionId) {
      var sessionId = parseSessionId[1];
      return {
        data: {
          sessionId: sessionId,
          status: 13,
          value: {
            message: errorMessage,
            error: constants.STATIC_MESSAGES.REQ_FAILED_MSG
          },
          state: 'error'
        },
        statusCode: constants.CUSTOM_ERROR_RESPONSE_CODE
      };
    } else {
      return {
        data: {
          message: errorMessage,
          error: constants.STATIC_MESSAGES.REQ_FAILED_MSG
        },
        statusCode: constants.CUSTOM_ERROR_RESPONSE_CODE
      };
    }
  },

  /**
   * Handler for incoming requests to Requests Debugger Tool server.
   * @param {http.IncomingMessage} clientRequest 
   * @param {http.ServerResponse} clientResponse 
   * @param {String} serverType 
   */
  requestHandler: function (clientRequest, clientResponse, serverType) {
    clientRequest.id = ++RdHandler._requestCounter + '::' + uuidv4();
    var path = url.parse(clientRequest.url).path;
    var request = {
      method: clientRequest.method,
      url: clientRequest.url,
      headers: clientRequest.headers,
      data: []
    };
    RdGlobalConfig.reqLogger.info(constants.TOPICS.CLIENT_REQUEST_START, request.method + ' ' + path,
      false, { 
        headers: request.headers 
      }, 
      clientRequest.id);

    var furtherRequestOptions = RdHandler._generateRequestOptions(clientRequest, serverType);

    var paramsForRequest = {
      request: request,
      furtherRequestOptions: furtherRequestOptions
    };

    ReqLib.call(paramsForRequest, clientRequest)
      .then(function (response) {
        RdGlobalConfig.reqLogger.info(constants.TOPICS.CLIENT_RESPONSE_END, clientRequest.method + ' ' + path + ', Status Code: ' + response.statusCode,
          false, {
            data: response.data,
            headers: response.headers,
          },
          clientRequest.id);

        clientResponse.writeHead(response.statusCode, response.headers);
        clientResponse.end(response.data);
      })
      .catch(function (err) {
        RdGlobalConfig.reqLogger.error(err.customTopic || constants.TOPICS.UNEXPECTED_ERROR, clientRequest.method + ' ' + clientRequest.url,
          false, {
            errorMessage: err.message.toString()
          },
          clientRequest.id);

        var errorResponse = RdHandler._frameErrorResponse(furtherRequestOptions, err.message.toString());
        RdGlobalConfig.reqLogger.error(constants.TOPICS.CLIENT_RESPONSE_END, clientRequest.method + ' ' + path + ', Status Code: ' + errorResponse.statusCode,
          false,
          errorResponse.data,
          clientRequest.id);

        clientResponse.writeHead(errorResponse.statusCode);
        clientResponse.end(JSON.stringify(errorResponse.data));
      });
  },

  /**
   * Handler for incoming requests to Requests Debugger Tool proxy server.
   * @param {http.IncomingMessage} clientRequest 
   * @param {http.ServerResponse} clientResponse 
   */
  proxyRequestHandler: function (clientRequest, clientResponse) {
    RdHandler.requestHandler(clientRequest, clientResponse, constants.SERVER_TYPES.PROXY);
  },

  /**
   * Handler for incoming requests to Requests Debugger Tool reverse proxy server.
   * @param {http.IncomingMessage} clientRequest 
   * @param {http.ServerResponse} clientResponse 
   */
  reverseProxyRequestHandler: function (clientRequest, clientResponse) {
    RdHandler.requestHandler(clientRequest, clientResponse, constants.SERVER_TYPES.REVERSE_PROXY);
  },

  /**
   * Starts the proxy server on the given port
   * @param {String|Number} port 
   * @param {Function} callback 
   */
  startProxyServer: function (port, callback) {
    try {
      RdHandler.proxyServer = http.createServer(RdHandler.proxyRequestHandler);
      RdHandler.proxyServer.listen(port);
      RdHandler.proxyServer.on('listening', function () {
        callback(null, port);
      });
      RdHandler.proxyServer.on('error', function (err) {
        callback(err.toString(), null);
      });
    } catch (e) {
      callback(e.toString(), null);
    }
  },
  
  /**
   * Starts the reverse proxy server on the given port
   * @param {String|Number} port 
   * @param {Function} callback 
   */
  startReverseProxyServer: function (port, callback) {
    try {
      RdHandler.reverseProxyServer = http.createServer(RdHandler.reverseProxyRequestHandler);
      RdHandler.reverseProxyServer.listen(port);
      RdHandler.reverseProxyServer.on('listening', function () {
        callback(null, port);
      });
      RdHandler.reverseProxyServer.on('error', function (err) {
        callback(err.toString(), null);
      });
    } catch (e) {
      callback(e.toString(), null);
    }
  },

  /**
   * Stops the currently running proxy server
   * @param {Function} callback 
   */
  stopProxyServer: function (callback) {
    try {
      if (RdHandler.proxyServer) {
        RdHandler.proxyServer.close();
        RdHandler.proxyServer = null;
      }
      callback(null, true);
    } catch (e) {
      callback(e.toString(), null);
    }
  },

  /**
   * Stops the currently running reverse proxy server
   * @param {Function} callback 
   */
  stopReverseProxyServer: function (callback) {
    try {
      if (RdHandler.reverseProxyServer) {
        RdHandler.reverseProxyServer.close();
        RdHandler.reverseProxyServer = null;
      }
      callback(null, true);
    } catch (e) {
      callback(e.toString(), null);
    }
  }

};

module.exports = RdHandler;
