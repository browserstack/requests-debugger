var nock = require('nock');
var url = require('url');

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

function nockGetRequestWithError(reqUrl, type) {
  type = (['http', 'https'].indexOf(type) !== -1) ? type : 'http';

  var parsedUrl = url.parse(reqUrl);
  var port = parsedUrl.port;
  port = port || (type === 'http' ? '80' : '443');
  return nock(type + '://' + parsedUrl.hostname + ':' + port)
    .get(parsedUrl.path)
    .replyWithError('something terrible');
}

module.exports = {
  nockGetRequest,
  nockProxyUrl,
  nockGetRequestWithError
}