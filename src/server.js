var http = require('http');
var keepAliveAgent = new http.Agent({ keepAlive: true });
var url = require('url');
var Utils = require('./utils');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;

var NWTHandler = {

  _requestCounter: 0,

  generatorForRequestOptionsObject: function () {
    NWTHandler._reqObjTemplate = {
      method: null,
      headers: {},
      host: null,
      port: null,
      path: null
    }

    if (NwtGlobalConfig.proxy) {
      NWTHandler._reqObjTemplate.host = NwtGlobalConfig.proxy.host;
      NWTHandler._reqObjTemplate.port = NwtGlobalConfig.proxy.port;
      
      if (NwtGlobalConfig.proxy.username && NwtGlobalConfig.proxy.password) {
        NWTHandler._reqObjTemplate.headers['Proxy-Authorization'] = Utils.proxyAuthToBase64(NwtGlobalConfig.proxy);
      }

      NWTHandler._generateRequestOptions = function (clientRequest) {
        var parsedClientUrl = url.parse(clientRequest.url);
        var headersCopy = Object.assign({}, clientRequest.headers, NWTHandler._reqObjTemplate.headers);
        var requestOptions = Object.assign({}, NWTHandler._reqObjTemplate);
        requestOptions.path = parsedClientUrl.href;
        requestOptions.method = clientRequest.method;
        requestOptions.headers = headersCopy;
        return requestOptions;
      }
    } else {
      NWTHandler._generateRequestOptions = function (clientRequest) {
        var parsedClientUrl = url.parse(clientRequest.url);
        var requestOptions = Object.assign({}, NWTHandler._reqObjTemplate);
        requestOptions.host = parsedClientUrl.hostname;
        requestOptions.port = parsedClientUrl.port || 80;
        requestOptions.path = parsedClientUrl.path;
        requestOptions.method = clientRequest.method;
        requestOptions.headers = clientRequest.headers;
        if (parsedClientUrl.auth) {
          requestOptions.headers['authorization'] = Utils.proxyAuthToBase64(parsedClientUrl.auth);
        }
        return requestOptions;
      }
    }
  },

  _frameErrorResponse: function (parsedRequest, errorMessage) {
    errorMessage += '. ' + constants.REQ_FAILED_MSG;
    var parseSessionId = parsedRequest.path.match(/\/wd\/hub\/session\/([a-z0-9]+)\/*/);
    if (parseSessionId) {
      var sessionId = parseSessionId[1];
      return {
        data: {
          sessionId: sessionId,
          status: 13,
          value: {
            message: errorMessage,
            error: constants.REQ_FAILED_MSG
          },
          state: 'error'
        },
        statusCode: 500
      }
    } else {
      return {
        data: {
          message: errorMessage,
          error: constants.REQ_FAILED_MSG
        },
        statusCode: 500
      }
    }
  },

  /**
   * 
   * @param {Socket} source 
   * @param {Socket} destination 
   * @param {Buffer} chunk 
   */
  _dataEventHandler: function (source, destination, chunk) {
    if (!destination.write(chunk)) {
      source.pause();
      destination.once('drain', function () {
        source.resume();
      })
    }
  },

  _responseDataHandler: function (source, destination, chunk) {
    NWTHandler._dataEventHandler(source, destination, chunk);
  },

  _requestDataHandler: function (source, destination, chunk) {
    NWTHandler._dataEventHandler(source, destination, chunk);
  },

  _executeRequest: function (requestOptions, callback) {
    var toolToFurtherRequest = http.request(Object.assign({}, requestOptions, { agent: keepAliveAgent }), function (response) {
      callback(response);
    });

    return toolToFurtherRequest;
  },

  requestHandler: function (clientRequest, clientResponse) {
    clientRequest.id = ++NWTHandler._requestCounter;

    var request = {
      method: clientRequest.method,
      url: clientRequest.url,
      headers: clientRequest.headers,
      data: []
    }
    
    NwtGlobalConfig.ReqLogger.info("Request Start", request.method + ' ' + request.url, false,
                                    { headers: request.headers }, 
                                    clientRequest.id);

    var furtherRequestOptions = NWTHandler._generateRequestOptions(clientRequest);

    var response = {
      data: [],
      statusCode: null,
      errorMessage: null,
      headers: null
    }

    var furtherRequest = NWTHandler._executeRequest(furtherRequestOptions, function (incomingResponse) {
      clientResponse.writeHead(incomingResponse.statusCode, incomingResponse.headers);
      response.statusCode = incomingResponse.statusCode;
      response.headers = incomingResponse.headers;

      incomingResponse.on('data', function (chunk) {
        response.data.push(chunk);
        NWTHandler._responseDataHandler(incomingResponse, clientResponse, chunk);
      });

      incomingResponse.on('end', function () {
        response.data = Buffer.concat(response.data).toString();
        NwtGlobalConfig.ReqLogger.info("Response End", clientRequest.method + ' ' + clientRequest.url + ', Status Code: ' + response.statusCode,
                                        false,
                                        { data: response.data, headers: response.headers, errorMessage: response.errorMessage },
                                        clientRequest.id);
        clientResponse.end();
      });
    });

    NwtGlobalConfig.ReqLogger.info("Tool Request", clientRequest.method + ' ' + clientRequest.url, false,
                                      furtherRequestOptions,
                                      clientRequest.id);

    furtherRequest.on('error', function (err) {
      NwtGlobalConfig.ReqLogger.error("Tool Request", clientRequest.method + ' ' + clientRequest.url, false,
                                       Object.assign({}, furtherRequestOptions, { errorMessage: err.toString() }, { data: Buffer.concat(request.data).toString() }),
                                       clientRequest.id);

      var errorResponse = NWTHandler._frameErrorResponse(furtherRequestOptions, err.toString());
      clientResponse.writeHead(errorResponse.statusCode);
      clientResponse.end(JSON.stringify(errorResponse.data));

      NwtGlobalConfig.NetworkLogHandler("During Further Request", clientRequest.id);
      NwtGlobalConfig.ConnHandler("During Further Request", clientRequest.id);
    });

    clientRequest.on('data', function (chunk) {
      request.data.push(chunk);
      NWTHandler._requestDataHandler(clientRequest, furtherRequest, chunk);
    });

    clientRequest.on('error', function (err) {
      NwtGlobalConfig.ReqLogger.error("Request", clientRequest.method + ' ' + clientRequest.url, false,
                                       { headers: request.headers, errorMessage: err.toString() },
                                       clientRequest.id);
      furtherRequest.end();

      NwtGlobalConfig.NetworkLogHandler("Request", clientRequest.id);
      NwtGlobalConfig.ConnHandler("Request", clientRequest.id);
    });

    clientRequest.on('end', function () {
      NwtGlobalConfig.ReqLogger.info("Request End", request.method + ' ' + request.url, false,
                                      { data: Buffer.concat(request.data).toString() },
                                      clientRequest.id);
      furtherRequest.end();
    });

    furtherRequest.setTimeout(constants.CLIENT_REQ_TIMEOUT, function () {
      furtherRequest.destroy(constants.REQ_TIMED_OUT);
    });

  },

  startProxy: function () {
    NWTHandler.generatorForRequestOptionsObject();
    var server = http.createServer(NWTHandler.requestHandler);
    server.listen(9687, function () {
      console.log("Started on 9687");
    });
  }
}

module.exports = NWTHandler;
