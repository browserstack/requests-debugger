/**
 * Entry point for setting up of Requests Debugger Tool.
 * Initiates actions such as processing of args, setting up loggers,
 * initiating all connectivity checks and stats collection before starting
 * the proxy tool.
 */

var constants = require('../config/constants');
var LogFiles = constants.LOGS;
var RdGlobalConfig = constants.RdGlobalConfig;
var STATIC_MESSAGES = constants.STATIC_MESSAGES;
var CommandLineManager = require('./commandLine');
var ConnectivityChecker = require('./connectivity');
var proxy = require('./proxy');
var reverseProxy = require('./reverseProxy');
var StatsFactory = require('./stats/statsFactory');
var LogManager = require('./logger');
var fs = require('fs');
var path = require('path');
var Utils = require('./utils');

var RdTool = {

  /**
   * Initialize the logging directory by resolving the path.
   * Exits if there was an error in creating the logs folder at that path.
   */
  _initLoggingDirectory: function () {
    var basePath = RdGlobalConfig.logsPath ? path.resolve(RdGlobalConfig.logsPath) : process.cwd();
    RdGlobalConfig.LOGS_DIRECTORY = path.resolve(basePath, constants.LOGS_FOLDER);

    if (RdGlobalConfig.DELETE_EXISTING_LOGS) {
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
      if (e.code !== constants.ERROR_CODES.EEXIST) {
        var errorMessage = "Error in creating " + constants.LOGS_FOLDER + " folder at path: " + basePath + "\n"
                           + "Message: " + e.toString() + "\n";
        console.log(errorMessage);
        process.exit(1);
      }
    }
  },

  /**
   * Initializes the Loggers.
   */
  _initLoggers: function () {
    RdGlobalConfig.networkLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.NETWORK));
    RdGlobalConfig.memLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.MEM));
    RdGlobalConfig.cpuLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.CPU));
    RdGlobalConfig.reqLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.REQUESTS));
    RdGlobalConfig.connLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.CONNECTIVITY));
    RdGlobalConfig.errLogger = LogManager.initializeLogger(path.resolve(RdGlobalConfig.LOGS_DIRECTORY, LogFiles.ERROR));
  },

  /**
   * Initialize the handlers for specific loggers. Wrappers over statsHandler to perform the
   * task and log using the loggers.
   */
  _initLoggingHandlers: function () {
    RdGlobalConfig.statsHandler = StatsFactory.getHandler(process.platform);

    RdGlobalConfig.networkLogHandler = function (topic, uuid, callback) {
      topic = topic || constants.TOPICS.NO_TOPIC;
      RdGlobalConfig.statsHandler.network(function (networkStats) {
        RdGlobalConfig.networkLogger.info(topic, networkStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    RdGlobalConfig.cpuLogHandler = function (topic, uuid, callback) {
      topic = topic || constants.TOPICS.NO_TOPIC;
      RdGlobalConfig.statsHandler.cpu(function (cpuStats) {
        RdGlobalConfig.cpuLogger.info(topic, cpuStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    RdGlobalConfig.memLogHandler = function (topic, uuid, callback) {
      topic = topic || constants.TOPICS.NO_TOPIC;
      RdGlobalConfig.statsHandler.mem(function (memStats) {
        RdGlobalConfig.memLogger.info(topic, memStats, false, {}, uuid);
        if (Utils.isValidCallback(callback)) callback();
      });
    };

    RdGlobalConfig.connHandler = ConnectivityChecker.fireChecks;
  },

  /**
   * Calls internal methods to set up logs directory, loggers and handlers
   */
  initLoggersAndHandlers: function () {
    RdTool._initLoggingDirectory();
    RdTool._initLoggers();
    RdTool._initLoggingHandlers();
  },

  /**
   * Entry point of the Tool. Scans CLI args, sets up loggers, fires stats
   * collection and connectivity checks. Finally, sets up the tool proxy
   */
  start: function () {
    CommandLineManager.processArgs(process.argv);
    console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.STARTING_TOOL, '-', '-', 60, true));
    RdTool.initLoggersAndHandlers();
    /* eslint-disable indent */
    console.log(Utils.formatAndBeautifyLine("Refer '" + RdGlobalConfig.LOGS_DIRECTORY + "' folder for CPU/Network/Memory" +
                                            " Stats and Connectivity Checks with BrowserStack components",
                                            '', '-', 60, true));
    /*eslint-enable indent*/

    console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.CHECK_CPU_STATS, '', '-', 60, true));
    RdGlobalConfig.cpuLogHandler('Initial CPU', null, function () {
      console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.CPU_STATS_COLLECTED, '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.CHECK_NETWORK_STATS, '', '-', 60, true));
    RdGlobalConfig.networkLogHandler('Initial Network', null, function () {
      console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.NETWORK_STATS_COLLECTED, '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.CHECK_MEMORY_STATS, '', '-', 60, true));
    RdGlobalConfig.memLogHandler('Initial Memory', null, function () {
      console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.MEMORY_STATS_COLLECTED, '', '-', 60, true));
    });

    console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.CHECK_CONNECTIVITY, '', '-', 60, true));
    RdGlobalConfig.connHandler('Initial Connectivity', null, function () {
      console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.CONNECTIVITY_CHECKS_DONE, '', '-', 60, true));
    });

    proxy.RdHandler.startServer(RdGlobalConfig.RD_HANDLER_PORT, function (err, result) {
      if (err) {
        console.log(STATIC_MESSAGES.ERR_STARTING_TOOL, err);
        console.log('Exiting the Proxy...');
        process.exit(1);
      }
      console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.TOOL_STARTED_ON_PORT + result, '', '-', 60, true));
    });

    reverseProxy.RdHandler.startServer(RdGlobalConfig.RD_HANDLER_REVERSE_PROXY_PORT, function (err, result) {
      if (err) {
        console.log(STATIC_MESSAGES.ERR_STARTING_TOOL, err);
        console.log('Exiting the Reverse Proxy...');
        process.exit(1);
      }
      console.log(Utils.formatAndBeautifyLine(STATIC_MESSAGES.TOOL_REVERSE_PROXY_STARTED_ON_PORT + result, '', '-', 60, true));
    });

  }
};

RdTool.start();
