var winston = require('winston');

var LogManager = {
  getLogger: function (filename) {
    return new (winston.Logger)({
      transports: [
        new (winston.transports.File)({
          filename
        })
      ]
    })
  },

  initializeLogger: function (filename) {
    var newLogger = LogManager.getLogger(filename);
    newLogger.transports.file.timestamp = function () {
      return (new Date().toISOString());
    }
    newLogger.transports.file.formatter = function (options) {
      return options.timestamp()
             + (options.meta.uuid ? ' [#' + options.meta.uuid + ']': '' )
             + (options.meta.topic ? ' [' + options.meta.topic + ']' : '' )
             + ' [' + options.level.toUpperCase() + ']'
             + ' ' + options.message
    }
    newLogger.transports.file.json = false;

    newLogger.info("************* LOGGER INITIALIZED **************\r\n");
    
    return {
      info: function (topic, message, stringify, data, uuid) {
        stringify = stringify || false;
        message = stringify ? JSON.stringify(message) : message;
        data = JSON.stringify(data);
        newLogger.info(message + ', ' + (data !== '{}' ? data : ""), { topic: topic || '', uuid: uuid || '' });
      },
      error: function (topic, message, stringify, data, uuid) {
        stringify = stringify || false;
        message = stringify ? JSON.stringify(message) : message;
        data = JSON.stringify(data);
        newLogger.error(message + ', ' + (data !== '{}' ? data : ""), { topic: topic || '', uuid: uuid || '' });
      }
    }
  }
}

module.exports = LogManager;
