/**
 * Base stats object which is inherited by objects of other platforms for generating their
 * stats object.
 */

var Utils = require('../utils');

var BaseStats = {
  description: "Base Object for System & Network Stats",

  cpu: function (callback) {
    if (Utils.isValidCallback(callback)) callback("CPU Stats Not Yet Implemented");
  },

  mem: function (callback) {
    if (Utils.isValidCallback(callback)) callback("Mem Stats Not Yet Implemented");
  },

  network: function (callback) {
    if (Utils.isValidCallback(callback)) callback("Network Stats Not Yet Implemented");
  }

};

module.exports = BaseStats;
