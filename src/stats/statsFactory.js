var MacStats = require('./macStats');
var WinStats = require('./winStats');
var LinuxStats = require('./linuxStats');
var BaseStats = require('./baseStats');

var HANDLER_MAPPING = {
  'linux': LinuxStats,
  'darwin': MacStats,
  'win': WinStats
}

var StatsFactory = {
  getHandler: function (type) {
    var handler = HANDLER_MAPPING[type] || BaseStats;
    return handler;
  }
}

module.exports = StatsFactory;
