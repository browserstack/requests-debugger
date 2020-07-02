/**
 * Stats object for fetching information from Mac platform.
 * It implements the inherited functions.
 */

var os = require('os');
var BaseStats = require('./baseStats');
var cp = require('child_process');
var Utils = require('../utils');
var constants = require('../../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;

var MacStats = Object.create(BaseStats);
MacStats.description = constants.STATIC_MESSAGES.MAC_STATS_DESC;

MacStats.cpu = function (callback) {
  var startTime = new Date();
  cp.exec(constants.MAC.TOP_3_SAMPLES, function (err, result) {
    if (!err) {
      result = result.toString().replace(/Processes:/g, '\n****************** ITERATION ******************\nProcesses:');
      result = Utils.generateHeaderAndFooter(result, 'CPU Information with 3 samples', new Date(), startTime);
    }
    if (Utils.isValidCallback(callback)) callback(result || constants.STATIC_MESSAGES.NO_REPORT_GENERATED + 'CPU' + os.EOL);
  });
};

MacStats.mem = function (callback) {

  var memStats = {
    total: os.totalmem(),
    free: os.freemem(),
    swapTotal: 0,
    swapUsed: 0,
    swapFree: 0
  };

  memStats.used = memStats.total - memStats.free;

  cp.exec(constants.MAC.SWAP_USAGE, function (err, result) {
    if (!err) {
      try {
        var resultLines  = result.toString().split('\n');
        if (resultLines[0]) {
          var statLines = resultLines[0].trim().split('  ');
          for (var index in statLines) {
            var swapStatType = statLines[index].toLowerCase().match(/total|used|free/i);
            /* eslint-disable indent */
            switch (swapStatType && swapStatType[0]) {
              case 'total':
                memStats.swapTotal = parseFloat(statLines[index].split('=')[1].trim()) * 1024 * 1024;
                break;
  
              case 'used':
                memStats.swapUsed = parseFloat(statLines[index].split('=')[1].trim()) * 1024 * 1024;
                break;
              
              case 'free':
                memStats.swapFree = parseFloat(statLines[index].split('=')[1].trim()) * 1024 * 1024;
                break;
            }
            /* eslint-enable indent */
          }
        }
      } catch (e) {
        RdGlobalConfig.ErrLogger.error(constants.TOPICS.MAC_MEM, e.toString(), false, {});
      }
    }
    if (Utils.isValidCallback(callback)) callback(Utils.beautifyObject(memStats, "Memory", "Bytes"));
  });
};

MacStats.network = function (callback) {
  var startTime = new Date();
  var commands = [constants.MAC.TCP_LISTEN_ESTABLISHED, constants.COMMON.PING_HUB, constants.COMMON.PING_AUTOMATE];
  var finalOutput = "";

  Utils.execMultiple(commands, function (results) {
    for (var i = 0; i < results.length; i++) {
      finalOutput = finalOutput + Utils.generateHeaderAndFooter(results[i].content, "Network Stat: '" + commands[i] + "'", results[i].generatedAt, startTime);
    }

    if (Utils.isValidCallback(callback)) callback(finalOutput);
  });
};

module.exports = MacStats;

