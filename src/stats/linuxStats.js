/**
 * Stats Object for fetching information from Linux platform.
 * It implements the inherited functions.
 */

var os = require('os');
var BaseStats = require('./baseStats');
var cp = require('child_process');
var fs = require('fs');
var Utils = require('../utils');
var constants = require('../../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;

var LinuxStats = Object.create(BaseStats);
LinuxStats.description = constants.STATIC_MESSAGES.LINUX_STATS_DESC;

LinuxStats.cpu = function (callback) {
  var startTime = new Date();
  cp.exec(constants.LINUX.TOP_3_SAMPLES, function (err, result) {
    if (!err) {
      result = result.toString().replace(/top -/g, '\n****************** ITERATION ******************\ntop -');
      result = Utils.generateHeaderAndFooter(result, 'CPU Information with 3 samples', new Date(), startTime);
    }
    if (Utils.isValidCallback(callback)) callback(result || constants.STATIC_MESSAGES.NO_REPORT_GENERATED + 'CPU' + os.EOL);
  });
};

LinuxStats.mem = function (callback) {
  var memStats = {
    total: os.totalmem(),
    free: os.freemem(),
    swapTotal: 0,
    swapUsed: 0,
    swapFree: 0
  };

  memStats.used = memStats.total - memStats.free;

  fs.readFile(constants.LINUX.PROC_MEMINFO, function (err, fileContent) {
    if (!err) {
      try {
        var memStatLines = fileContent.toString().split('\n');
        memStats.total = parseInt(Utils.fetchPropertyValue(memStatLines, 'memtotal'));
        memStats.total = memStats.total ? memStats.total * 1024 : os.totalmem();
        memStats.free = parseInt(Utils.fetchPropertyValue(memStatLines, 'memfree'));
        memStats.free = memStats.free ? memStats.free * 1024 : os.freemem();
        memStats.used = memStats.total - memStats.free;
  
        memStats.swapTotal = parseInt(Utils.fetchPropertyValue(memStatLines, 'swaptotal'));
        memStats.swapTotal = memStats.swapTotal ? memStats.swapTotal * 1024 : 0;
        memStats.swapFree = parseInt(Utils.fetchPropertyValue(memStatLines, 'swapfree'));
        memStats.swapFree = memStats.swapFree ? memStats.swapFree * 1024 : 0;
        memStats.swapUsed = memStats.swapTotal - memStats.swapFree;
      } catch (e) {
        RdGlobalConfig.errLogger.error(constants.TOPICS.LINUX_MEM, e.toString(), false, {});
      }
    }
    if (Utils.isValidCallback(callback)) callback(Utils.beautifyObject(memStats, "Memory", "Bytes"));
  });
};

LinuxStats.network = function (callback) {
  var startTime = new Date();
  var commands = [constants.LINUX.TCP_LISTEN_ESTABLISHED, constants.COMMON.PING_HUB, constants.COMMON.PING_AUTOMATE];
  var finalOutput = "";

  Utils.execMultiple(commands, function (results) {
    for (var i = 0; i < results.length; i++) {
      finalOutput = finalOutput + Utils.generateHeaderAndFooter(results[i].content, "Network Stat: '" + commands[i] + "'", results[i].generatedAt, startTime);
    }

    if (Utils.isValidCallback(callback)) callback(finalOutput);
  });
};

module.exports = LinuxStats;
