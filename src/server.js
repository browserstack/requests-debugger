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
   * Generates the request options template for firing requests
   */
  generatorForRequestOptionsObject: function () {
    RdHandler._reqObjTemplate = {
      method: null,
      headers: {},
      host: null,
      port: null,
      path: null
    };
    
    if (RdGlobalConfig.proxy) {
      RdHandler._reqObjTemplate.host = RdGlobalConfig.proxy.host;
      RdHandler._reqObjTemplate.port = RdGlobalConfig.proxy.port;
      
      if (RdGlobalConfig.proxy.username && RdGlobalConfig.proxy.password) {
        RdHandler._reqObjTemplate.headers['Proxy-Authorization'] = Utils.proxyAuthToBase64(RdGlobalConfig.proxy);
      }
    }   
    var requestOptions = Object.assign({}, RdHandler._reqObjTemplate);


    /**
     * Sets the internal method to generate request options
     * doesn't exists
     * @param {http.IncomingMessage} clientRequest 
     * @returns {Object}
     */
    RdHandler._generateRequestOptions = function (clientRequest) {
      requestOptions.method = clientRequest.method;
      var parsedClientUrl = url.parse(clientRequest.url);
      if (RdGlobalConfig.proxy) {
        requestOptions.host = RdGlobalConfig.proxy.host;
        requestOptions.port = RdGlobalConfig.proxy.port; 
        requestOptions.path = RdGlobalConfig.SCHEME + "://" + constants.HUB_HOST + parsedClientUrl.path;
      }
      else {
        requestOptions.host = constants.HUB_HOST;
        requestOptions.port = RdGlobalConfig.PORT; 
        requestOptions.path = parsedClientUrl.path;
      }
      requestOptions.headers = Object.assign(requestOptions.headers, clientRequest.headers, RdHandler._reqObjTemplate.headers);
      RdHandler._reqObjTemplate.headers['host'] = constants.BS_DOMAIN;
      if (parsedClientUrl.auth) {
        requestOptions.headers['authorization'] = Utils.proxyAuthToBase64(parsedClientUrl.auth);
      }
      return requestOptions;
    };
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
   */
  requestHandler: function (clientRequest, clientResponse) {
    clientRequest.id = ++RdHandler._requestCounter + '::' + uuidv4();

    var request = {
      method: clientRequest.method,
      url: clientRequest.url,
      headers: clientRequest.headers,
      data: []
    };
    
    RdGlobalConfig.reqLogger.info(constants.TOPICS.CLIENT_REQUEST_START, request.method + ' ' + request.url,
      false, { 
        headers: request.headers 
      }, 
      clientRequest.id);

    var furtherRequestOptions = RdHandler._generateRequestOptions(clientRequest);

    var paramsForRequest = {
      request: request,
      furtherRequestOptions: furtherRequestOptions
    };

    ReqLib.call(paramsForRequest, clientRequest)
      .then(function (response) {
        RdGlobalConfig.reqLogger.info(constants.TOPICS.CLIENT_RESPONSE_END, clientRequest.method + ' ' + clientRequest.url + ', Status Code: ' + response.statusCode,
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
        RdGlobalConfig.reqLogger.error(constants.TOPICS.CLIENT_RESPONSE_END, clientRequest.method + ' ' + clientRequest.url + ', Status Code: ' + errorResponse.statusCode,
          false,
          errorResponse.data,
          clientRequest.id);

        clientResponse.writeHead(errorResponse.statusCode);
        clientResponse.end(JSON.stringify(errorResponse.data));
      });
  },

  /**
   * Starts the server on the given port
   * @param {String|Number} port 
   * @param {Function} callback 
   */
  startServer: function (port, callback) {
    try {
      RdHandler.generatorForRequestOptionsObject();
      RdHandler.server = http.createServer(RdHandler.requestHandler);
      RdHandler.server.listen(port);
      RdHandler.server.on('listening', function () {
        callback(null, port);
      });
      RdHandler.server.on('error', function (err) {
        callback(err.toString(), null);
      });
    } catch (e) {
      callback(e.toString(), null);
    }
  },

  /**
   * Stops the currently running server
   * @param {Function} callback 
   */
  stopServer: function (callback) {
    try {
      if (RdHandler.server) {
        RdHandler.server.close();
        RdHandler.server = null;
      }
      callback(null, true);
    } catch (e) {
      callback(e.toString(), null);
    }
  }
};

module.exports = RdHandler;
