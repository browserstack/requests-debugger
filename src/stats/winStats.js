/**
 * Stats object for fetching information from Windows platforms
 * It implements the inherited functions.
 */

var os = require('os');
var BaseStats = require('./baseStats');
var cp = require('child_process');
var Utils = require('../utils');
var constants = require('../../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;

var WinStats = Object.create(BaseStats);
WinStats.description = "System and Network Stats for Windows";
WinStats.wmicPath = null;

// Need to add better CPU stats here. Preferably loadavg like linux/unix.
WinStats.cpu = function (callback) {
  WinStats.wmicPath = WinStats.wmicPath || Utils.getWmicPath();
  var startTime = new Date();

  cp.exec(WinStats.wmicPath + constants.WIN.LOAD_PERCENTAGE, function (err, result) {
    if (!err) {
      result = Utils.generateHeaderAndFooter(result, "Load Percentage", new Date(), startTime);
    }
    if (Utils.isValidCallback(callback)) callback(result || constants.NO_REPORT_GENERATED + 'CPU' + os.EOL);
  });
};

WinStats.mem = function (callback) {

  var memStats = {
    total: os.totalmem(),
    free: os.freemem(),
    swapTotal: 0,
    swapUsed: 0,
    swapFree: 0
  };

  memStats.used = memStats.total - memStats.free;

  WinStats.wmicPath = WinStats.wmicPath || Utils.getWmicPath();

  cp.exec(WinStats.wmicPath + constants.WIN.SWAP_USAGE, function (err, result) {
    if (!err) {
      try {
        result = result.split('\r\n').filter(function (line) { return line.trim() !== ''; });
        result.shift();
        var swapTotal = 0;
        var swapUsed = 0;
        for (var index in result) {
          var line = result[index].trim().split(/\s\s+/);
          swapTotal += parseInt(line[0]);
          swapUsed += parseInt(line[1]);
        }
        memStats.swapTotal = swapTotal * 1024 * 1024;
        memStats.swapUsed = swapUsed * 1024 * 1024;
        memStats.swapFree = memStats.swapTotal - memStats.swapUsed;
      } catch (e) {
        RdGlobalConfig.ErrLogger('Win-Mem', e.toString(), false, {});
      }
    }
    if (Utils.isValidCallback(callback)) callback(Utils.beautifyObject(memStats, "Memory", "Bytes"));
  });
};

WinStats.network = function (callback) {
  var startTime = new Date();
  var commands = [constants.WIN.NETSTAT_TCP, constants.WIN.NETSTAT_ROUTING_TABLE, constants.WIN.IPCONFIG_ALL, constants.WIN.PING_HUB, constants.WIN.PING_AUTOMATE];
  var finalOutput = "";

  Utils.execMultiple(commands, function (results) {
    for (var i = 0; i < results.length; i++) {
      finalOutput = finalOutput + Utils.generateHeaderAndFooter(results[i].content, "Network Stat: '" + commands[i] + "'", results[i].generatedAt, startTime);
    }

    if (Utils.isValidCallback(callback)) callback(finalOutput);
  });
};

module.exports = WinStats;

