/**
 * Base stats object which is inherited by objects of other platforms for generating their
 * stats object.
 */

var Utils = require('../utils');
var STATIC_MESSAGES = require('../../config/constants').STATIC_MESSAGES;

var BaseStats = {
  description: STATIC_MESSAGES.BASE_STATS_DESC,

  cpu: function (callback) {
    if (Utils.isValidCallback(callback)) callback(STATIC_MESSAGES.CPU_STATS_NOT_IMPLEMENTED);
  },

  mem: function (callback) {
    if (Utils.isValidCallback(callback)) callback(STATIC_MESSAGES.MEM_STATS_NOT_IMPLEMENTED);
  },

  network: function (callback) {
    if (Utils.isValidCallback(callback)) callback(STATIC_MESSAGES.NETWORK_STATS_NOT_IMPLEMENTED);
  }

};

module.exports = BaseStats;
