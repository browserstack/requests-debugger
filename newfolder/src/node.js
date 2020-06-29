/**
 * Entry point for setting up of Network Utility Tool.
 * Initiates actions such as processing of args, setting up loggers,
 * initiating all connectivity checks and stats collection before starting
 * the proxy tool.
 */

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
    var basePath = NwtGlobalConfig.logsPath ? path.resolve(NwtGlobalConfig.logsPath) : process.cwd();
    NwtGlobalConfig.LOGS_DIRECTORY = path.resolve(basePath, 'NetworkUtilityLogs');

    if (NwtGlobalConfig.deleteExistingLogs) {
      var filesToDelete = Object.keys(LogFiles).map(function (key) { return LogFiles[key]; });
      filesToDelete.forEach(function (file) {
        try {
          fs.unlinkSync(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, file));
          /* eslint-disable-next-line no-empty */
        } catch (e) {}
      });
    }

    try {
      fs.mkdirSync(NwtGlobalConfig.LOGS_DIRECTORY);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        var errorMessage = "Error in creating 'NetworkUtilityLogs' folder at path: " + basePath + "\n"
                           + "Message: " + e.toString() + "\n";
        console.log(errorMessage);
        process.exit(1);
      }
    }

    NwtGlobalConfig.NetworkLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.NETWORK));
    NwtGlobalConfig.MemLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.MEM));
    NwtGlobalConfig.CPULogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.CPU));
    NwtGlobalConfig.ReqLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.REQUESTS));
    NwtGlobalConfig.ConnLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.CONNECTIVITY));
    NwtGlobalConfig.ErrLogger = LogManager.initializeLogger(path.resolve(NwtGlobalConfig.LOGS_DIRECTORY, LogFiles.ERROR));

    NwtGlobalConfig.NetworkLogHandler = function (topic, uuid, callback) {
      topic = topic || 'NO_TOPIC';
      NwtGlobalConfig.StatsHandler.network(function (networkStats) {
        NwtGlobalConfig.NetworkLogger.info(topic, networkStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    NwtGlobalConfig.CpuLogHandler = function (topic, uuid, callback) {
      topic = topic || 'NO_TOPIC';
      NwtGlobalConfig.StatsHandler.cpu(function (cpuStats) {
        NwtGlobalConfig.CPULogger.info(topic, cpuStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    NwtGlobalConfig.MemLogHandler = function (topic, uuid, callback) {
      topic = topic || "NO_TOPIC";
      NwtGlobalConfig.StatsHandler.mem(function (memStats) {
        NwtGlobalConfig.MemLogger.info(topic, memStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    NwtGlobalConfig.ConnHandler = ConnectivityChecker.fireChecks;
  },

  start: function () {
    console.log(Utils.formatAndBeautifyLine('Starting Network Utility Tool', '-', '-', 60, true));
    CommandLineManager.processArgs(process.argv);
    NwtGlobalConfig.StatsHandler = StatsFactory.getHandler(process.platform);
    NwTool.initLoggers();
    /* eslint-disable indent */
    console.log(Utils.formatAndBeautifyLine("Refer '" + NwtGlobalConfig.LOGS_DIRECTORY + "' folder for CPU/Network/Memory" +
                                            " Stats and Connectivity Checks with BrowserStack components",
                                            '', '-', 60, true));
    /*eslint-enable indent*/

    console.log(Utils.formatAndBeautifyLine('Stats : Checking CPU Stats', '', '-', 60, true));
    NwtGlobalConfig.CpuLogHandler('Initial CPU', null, function () {
      console.log(Utils.formatAndBeautifyLine('Stats : Initial CPU Stats Collected', '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine('Stats : Checking Network Stats', '', '-', 60, true));
    NwtGlobalConfig.NetworkLogHandler('Initial Network', null, function () {
      console.log(Utils.formatAndBeautifyLine('Stats : Initial Network Stats Collected', '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine('Stats : Checking Memory Stats', '', '-', 60, true));
    NwtGlobalConfig.MemLogHandler('Initial Memory', null, function () {
      console.log(Utils.formatAndBeautifyLine('Stats : Initial Memory Stats Collected', '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine('Checks : Checking Connectivity With BrowserStack', '', '-', 60, true));
    NwtGlobalConfig.ConnHandler('Initial Connectivity', null, function () {
      console.log(Utils.formatAndBeautifyLine('Checks : Connectivity Checks Performed with BrowserStack', '', '-', 60, true));
    });

    NWTHandler.startProxy(constants.NWT_HANDLER_PORT, function (err, result) {
      if (err) {
        console.log('Error in starting Network Tool Utility Proxy: ', err);
        console.log('Exiting the Tool...');
        process.exit(1);
      }
      console.log(Utils.formatAndBeautifyLine('Network Utility Tool Proxy Started on Port: ' + result, '', '-', 60, true));
    });
  }
};

NwTool.start();
