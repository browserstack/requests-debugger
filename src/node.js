/**
 * Entry point for setting up of Requests Debugger Tool.
 * Initiates actions such as processing of args, setting up loggers,
 * initiating all connectivity checks and stats collection before starting
 * the proxy tool.
 */

var constants = require('../config/constants');
var LogFiles = constants.LOGS;
var RdGlobalConfig = constants.RdGlobalConfig;
var CommandLineManager = require('./commandLine');
var ConnectivityChecker = require('./connectivity');
var RdHandler = require('./server');
var StatsFactory = require('./stats/statsFactory');
var LogManager = require('./logger');
var fs = require('fs');
var path = require('path');
var Utils = require('./utils');

var RdTool = {

  /**
   * Initializes the Logging directory, Loggers & Stats Handlers.
   */
  initLoggers: function () {
    var basePath = RdGlobalConfig.logsPath ? path.resolve(RdGlobalConfig.logsPath) : process.cwd();
    RdGlobalConfig.LOGS_DIRECTORY = path.resolve(basePath, 'RequestsDebuggerLogs');

    if (RdGlobalConfig.deleteExistingLogs) {
      var filesToDelete = Object.keys(LogFiles).map(function (key) { return LogFiles[key]; });
      filesToDelete.forEach(function (file) {
        try {
          fs.unlinkSync(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, file));
          /* eslint-disable-next-line no-empty */
        } catch (e) {}
      });
    }

    try {
      fs.mkdirSync(RdGlobalConfig.LOGS_DIRECTORY);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        var errorMessage = "Error in creating 'RequestsDebuggerLogs' folder at path: " + basePath + "\n"
                           + "Message: " + e.toString() + "\n";
        console.log(errorMessage);
        process.exit(1);
      }
    }

    RdGlobalConfig.NetworkLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.NETWORK));
    RdGlobalConfig.MemLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.MEM));
    RdGlobalConfig.CPULogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.CPU));
    RdGlobalConfig.ReqLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.REQUESTS));
    RdGlobalConfig.ConnLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.CONNECTIVITY));
    RdGlobalConfig.ErrLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.ERROR));

    RdGlobalConfig.NetworkLogHandler = function (topic, uuid, callback) {
      topic = topic || 'NO_TOPIC';
      RdGlobalConfig.StatsHandler.network(function (networkStats) {
        RdGlobalConfig.NetworkLogger.info(topic, networkStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    RdGlobalConfig.CpuLogHandler = function (topic, uuid, callback) {
      topic = topic || 'NO_TOPIC';
      RdGlobalConfig.StatsHandler.cpu(function (cpuStats) {
        RdGlobalConfig.CPULogger.info(topic, cpuStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    RdGlobalConfig.MemLogHandler = function (topic, uuid, callback) {
      topic = topic || "NO_TOPIC";
      RdGlobalConfig.StatsHandler.mem(function (memStats) {
        RdGlobalConfig.MemLogger.info(topic, memStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    RdGlobalConfig.ConnHandler = ConnectivityChecker.fireChecks;
  },

  /**
   * Entry point of the Tool. Scans CLI args, sets up loggers, fires stats
   * collection and connectivity checks. Finally, sets up the tool proxy
   */
  start: function () {
    console.log(Utils.formatAndBeautifyLine('Starting Requests Debugger Tool', '-', '-', 60, true));
    CommandLineManager.processArgs(process.argv);
    RdGlobalConfig.StatsHandler = StatsFactory.getHandler(process.platform);
    RdTool.initLoggers();
    /* eslint-disable indent */
    console.log(Utils.formatAndBeautifyLine("Refer '" + RdGlobalConfig.LOGS_DIRECTORY + "' folder for CPU/Network/Memory" +
                                            " Stats and Connectivity Checks with BrowserStack components",
                                            '', '-', 60, true));
    /*eslint-enable indent*/

    console.log(Utils.formatAndBeautifyLine('Stats : Checking CPU Stats', '', '-', 60, true));
    RdGlobalConfig.CpuLogHandler('Initial CPU', null, function () {
      console.log(Utils.formatAndBeautifyLine('Stats : Initial CPU Stats Collected', '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine('Stats : Checking Network Stats', '', '-', 60, true));
    RdGlobalConfig.NetworkLogHandler('Initial Network', null, function () {
      console.log(Utils.formatAndBeautifyLine('Stats : Initial Network Stats Collected', '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine('Stats : Checking Memory Stats', '', '-', 60, true));
    RdGlobalConfig.MemLogHandler('Initial Memory', null, function () {
      console.log(Utils.formatAndBeautifyLine('Stats : Initial Memory Stats Collected', '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine('Checks : Checking Connectivity With BrowserStack', '', '-', 60, true));
    RdGlobalConfig.ConnHandler('Initial Connectivity', null, function () {
      console.log(Utils.formatAndBeautifyLine('Checks : Connectivity Checks Performed with BrowserStack', '', '-', 60, true));
    });

    RdHandler.startProxy(constants.RD_HANDLER_PORT, function (err, result) {
      if (err) {
        console.log('Error in starting Requests Debugger Tool Proxy: ', err);
        console.log('Exiting the Tool...');
        process.exit(1);
      }
      console.log(Utils.formatAndBeautifyLine('Requests Debugger Tool Proxy Started on Port: ' + result, '', '-', 60, true));
    });
  }
};

RdTool.start();
