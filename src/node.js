var constants = require('../config/constants');
var LogFiles = constants.LOGS;
var NwtGlobalConfig = constants.NwtGlobalConfig;
var CommandLineManager = require('./commandLine');
var ConnectivityChecker = require('./connectivity');
var NWTHandler = require('./server');
var StatsFactory = require('./stats/statsFactory');
var LogManager = require('./logger');
var fs = require('fs');
var path = require('path');
var Utils = require('./utils');

var NwTool = {
  initLoggers: function () {
    NwtGlobalConfig.LOGS_DIRECTORY = path.resolve(process.cwd(), 'NWT_Logs');

    if (NwtGlobalConfig.deleteExistingLogs) {
      var filesToDelete = Object.keys(LogFiles).map(function (key) { return LogFiles[key]});
      filesToDelete.forEach(function (file) {
        try {
          fs.unlinkSync(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, file))
        } catch (e) {}
      });
    }

    try {
      fs.mkdirSync(NwtGlobalConfig.LOGS_DIRECTORY);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        console.log("Error While Creating NWT_Logs Directory. Exiting with status code 1. Error: ", e);
        process.exit(1);
      }
    }

    NwtGlobalConfig.NetworkLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.NETWORK));
    NwtGlobalConfig.MemLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.MEM));
    NwtGlobalConfig.CPULogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.CPU));
    NwtGlobalConfig.ReqLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.REQUESTS));
    NwtGlobalConfig.ConnLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.CONNECTIVITY));

    NwtGlobalConfig.NetworkLogHandler = function (topic, uuid, callback) {
      topic = topic || 'NO_TOPIC';
      NwtGlobalConfig.StatsHandler.network(function (networkStats) {
        NwtGlobalConfig.NetworkLogger.info(topic, networkStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    }

    NwtGlobalConfig.CpuLogHandler = function (topic, uuid, callback) {
      topic = topic || 'NO_TOPIC';
      NwtGlobalConfig.StatsHandler.cpu(function (cpuStats) {
        NwtGlobalConfig.CPULogger.info(topic, cpuStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    }

    NwtGlobalConfig.MemLogHandler = function (topic, uuid, callback) {
      topic = topic || "NO_TOPIC";
      NwtGlobalConfig.StatsHandler.mem(function (memStats) {
        NwtGlobalConfig.MemLogger.info(topic, memStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    }

    NwtGlobalConfig.ConnHandler = ConnectivityChecker.fireChecks;
  },

  start: function () {
    CommandLineManager.processArgs(process.argv);
    NwtGlobalConfig.StatsHandler = StatsFactory.getHandler(process.platform);
    NwTool.initLoggers();
    NwtGlobalConfig.CpuLogHandler("Initial CPU");
    NwtGlobalConfig.NetworkLogHandler("Initial Network");
    NwtGlobalConfig.MemLogHandler("Initial Memory");
    NwtGlobalConfig.ConnHandler("Initial Connectivity", null, function () {
      NWTHandler.startProxy(constants.NWT_HANDLER_PORT, function (err, result) {
        if (err) {
          console.log("Error in starting Network Tool Utility Proxy: ", err);
          console.log("Exiting the Tool...");
          process.exit(1);
        }
      });
    });
  }
}

NwTool.start();