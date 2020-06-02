/**
 * Command Line Manager to parse the command line arguments
 * and set the necessary fields in NwtGlobalConfig.
 */

var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;

var CommandLineManager = {
  helpForArgs: function () {
    var helpOutput = "\nNetwork Utility Tool - A Proxy Tool for debugging request failures leading to\n"
                     + "dropping of requests or not being able to reach BrowserStack.\n"
                     + "\n"
                     + "Usage: NetworkUtilityTool [ARGUMENTS]\n"
                     + "ARGUMENTS:\n"
                     + "  --proxy-host <hostname>: Hostname of the Proxy which is required for the client requests\n"
                     + "  --proxy-port <port>: Port of the Proxy which is required for the client requests\n"
                     + "  --proxy-user <username>: Username of the Proxy which is required for the client requests\n"
                     + "  --proxy-pass <password>: Password of the Proxy which is required for the client requests\n"
                     + "  --del-logs: Deletes any existing logs from the NWT_Logs/ directory\n"
                     + "              and initializes new files for logging. Refer 'NWT_Logs/' directory in the same directory\n"
                     + "              where the Network Utility Tool exists\n"
                     + "  --help: Help for Network Utility Tool\n";

    console.log(helpOutput);
  },

  validArgValue: function (value) {
    return value && value.length > 0 && !value.startsWith('-');
  },

  /**
   * Processes the args from the given input array and sets the global config.
   * @param {Array<String>} argv 
   */
  processArgs: function (argv) {

    var index = argv.indexOf('--help');
    if (index !== -1) {
      CommandLineManager.helpForArgs();
      process.exit(0);
    }

    // Process proxy arguments
    index = argv.indexOf('--proxy-host');
    if (index !== -1 && CommandLineManager.validArgValue(argv[index + 1])) {
      NwtGlobalConfig['proxy'] = NwtGlobalConfig['proxy'] || {};
      NwtGlobalConfig.proxy['host'] = argv[index + 1];
      argv.splice(index, 2);

      index = argv.indexOf('--proxy-port');
      if (index !== -1 && CommandLineManager.validArgValue(argv[index + 1])) {
        NwtGlobalConfig.proxy['port'] = argv[index + 1];
        argv.splice(index, 2);
      } else {
        NwtGlobalConfig.proxy['port'] = constants.DEFAULT_PROXY_PORT;
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

    // process arguments which decides whether existing logs should be deleted
    // or appended
    var index = argv.indexOf('--del-logs');
    if (index !== -1) {
      NwtGlobalConfig.deleteExistingLogs = true;
      argv.splice(index, 1);
    } else {
      NwtGlobalConfig.deleteExistingLogs = false;
    }

    if (argv.length > 2) {
      console.log("\nInvalid Arguments: ", argv.slice(2).join(', '));
      CommandLineManager.helpForArgs();
      process.exit(0);
    }
  }
}

module.exports = CommandLineManager;
