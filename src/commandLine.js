var NwtGlobalConfig = require('../config/constants').NwtGlobalConfig;

var CommandLineManager = {
  validArgValue: function (value) {
    return value && value.length > 0 && !value.startsWith('-');
  },

  processArgs: function (argv) {

    // Process proxy arguments
    var index = argv.indexOf('--proxy-host');
    if (index !== -1 && CommandLineManager.validArgValue(argv[index + 1])) {
      NwtGlobalConfig['proxy'] = NwtGlobalConfig['proxy'] || {};
      NwtGlobalConfig.proxy['host'] = argv[index + 1];
      argv.splice(index, 2);

      index = argv.indexOf('--proxy-port');
      if (index !== -1 && CommandLineManager.validArgValue(argv[index + 1])) {
        NwtGlobalConfig.proxy['port'] = argv[index + 1];
        argv.splice(index, 2);
      } else {
        NwtGlobalConfig.proxy['port'] = 3128;
      }

      index = argv.indexOf('--proxy-user');
      if (index !== -1 && CommandLineManager.validArgValue(argv[index + 1])) {
        NwtGlobalConfig.proxy['username'] = argv[index + 1];
        argv.splice(index, 2);

        index = argv.indexOf('--proxy-pass');
        if (index !== -1 && CommandLineManager.validArgValue(argv[index + 1])) {
          NwtGlobalConfig.proxy['password'] = argv[index + 1];
          argv.splice(index, 2);
        } else {
          NwtGlobalConfig.proxy['password'] = '';
        }
      }
    }

    var index = argv.indexOf('--del-logs');
    if (index !== -1) {
      NwtGlobalConfig.deleteExistingLogs = true;
    } else {
      NwtGlobalConfig.deleteExistingLogs = false;
    }
  }
}

module.exports = CommandLineManager;