/**
 * Command Line Manager to parse the command line arguments
 * and set the necessary fields in RdGlobalConfig.
 */

var constants = require('../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;

var CommandLineManager = {
  helpForArgs: function () {
    var helpOutput = "\nRequests Debugger - A Proxy Tool for debugging request failures leading to\n"
                     + "dropping of requests or not being able to reach BrowserStack.\n"
                     + "\n"
                     + "Usage: RequestsDebugger [ARGUMENTS]\n\n"
                     + "ARGUMENTS:\n"
                     + "  --port        <port>                    : Port on which the Requests Debugger Tool's Proxy will run\n"
                     + "                                            Default: 9687\n"
                     + "  --proxy-host  <hostname>                : Hostname of the Upstream Proxy\n"
                     + "  --proxy-port  <port>                    : Port of the Upstream Proxy. Default: 3128 (if hostname is provided)\n"
                     + "  --proxy-user  <username>                : Username for auth of the Upstream Proxy\n"
                     + "  --proxy-pass  <password>                : Password for auth of the Upstream Proxy\n"
                     + "  --logs-path   <relative/absolute path>  : Directory where the 'RequestDebuggerLogs' folder will be created\n"
                     + "                                            for storing logs. Default: Current Working Directory\n"
                     + "  --del-logs                              : Deletes any existing logs from the RequestDebuggerLogs/ directory and initializes\n"
                     + "                                            new files for logging\n"
                     + "  --help                                  : Help for Requests Debugger Tool\n"
                     + "  --version                               : Version of the Requests Debugger Tool\n";

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

    /* eslint-disable no-undef */
    var missingArgs = new Set();
    var invalidArgs = new Set();
    /* eslint-enable no-undef */

    // help argument. Logs the CLI usage and exits
    var index = argv.indexOf('--help');
    if (index !== -1) {
      CommandLineManager.helpForArgs();
      process.exit(0);
    }

    // version argument. Logs the version and exits
    index = argv.indexOf('--version');
    if (index !== -1) {
      console.log("Version:", constants.VERSION);
      process.exit(0);
    }

    // port for Requests Debugger Proxy
    index = argv.indexOf('--port');
    if (index !== -1) {
      if (CommandLineManager.validArgValue(argv[index + 1])) {
        var probablePort = parseInt(argv[index + 1]);
        if (!isNaN(probablePort) && (probablePort <= constants.PORTS.MAX) && (probablePort >= constants.PORTS.MIN)) {
          constants.RD_HANDLER_PORT = probablePort;
        } else {
          console.log("Port can only range from:", constants.PORTS.MIN, "to:", constants.PORTS.MAX);
          invalidArgs.add('--port');
        }
        argv.splice(index, 2);
      } else {
        invalidArgs.add('--port');
        argv.splice(index, 1);
      }
    }

    // process proxy host
    index = argv.indexOf('--proxy-host');
    if (index !== -1) {
      if (CommandLineManager.validArgValue(argv[index + 1])) {
        RdGlobalConfig.proxy = RdGlobalConfig.proxy || {};
        RdGlobalConfig.proxy.host = argv[index + 1];
        argv.splice(index, 2);
      } else {
        invalidArgs.add('--proxy-host');
        argv.splice(index, 1);
      }
    }

    // process proxy port
    index = argv.indexOf('--proxy-port');
    if (index !== -1) {
      if (CommandLineManager.validArgValue(argv[index + 1])) {
        if (RdGlobalConfig.proxy && RdGlobalConfig.proxy.host) {
          RdGlobalConfig.proxy.port = argv[index + 1];
        } else {
          if (!invalidArgs.has('--proxy-host')) missingArgs.add('--proxy-host');
        }
        argv.splice(index, 2);
      } else {
        invalidArgs.add('--proxy-port');
        argv.splice(index, 1);
      }
    }
    
    // if proxy port value in invalid or doesn't exist and host exists, set the default value
    if (RdGlobalConfig.proxy && RdGlobalConfig.proxy.host && (invalidArgs.has('--proxy-port') || !RdGlobalConfig.proxy.port)) {
      console.log('Setting Default Proxy Port:', constants.DEFAULT_PROXY_PORT, '\n');
      RdGlobalConfig.proxy.port = constants.DEFAULT_PROXY_PORT;
      invalidArgs.delete('--proxy-port');
    }

    // process proxy user
    index = argv.indexOf('--proxy-user');
    if (index !== -1) {
      if (CommandLineManager.validArgValue(argv[index + 1])) {
        RdGlobalConfig.proxy = RdGlobalConfig.proxy || {};
        RdGlobalConfig.proxy.username = argv[index + 1];
        if (!(RdGlobalConfig.proxy && RdGlobalConfig.proxy.host)) {
          if (!invalidArgs.has('--proxy-host')) missingArgs.add('--proxy-host');
        }
        argv.splice(index, 2);
      } else {
        invalidArgs.add('--proxy-user');
        argv.splice(index, 1);
      }
    }

    // process proxy pass
    index = argv.indexOf('--proxy-pass');
    if (index !== -1) {
      if (CommandLineManager.validArgValue(argv[index + 1])) {
        if (RdGlobalConfig.proxy && RdGlobalConfig.proxy.username) {
          RdGlobalConfig.proxy.password = argv[index + 1];
        } else {
          if (!invalidArgs.has('--proxy-user')) missingArgs.add('--proxy-user');
        }
        argv.splice(index, 2);
      } else {
        invalidArgs.add('--proxy-pass');
        argv.splice(index, 1);
      }
    }
    
    // if proxy pass is invalid or doesn't exist and username exists, set the password as empty
    if (RdGlobalConfig.proxy && RdGlobalConfig.proxy.username && (invalidArgs.has('--proxy-pass') || !RdGlobalConfig.proxy.password)) {
      console.log('Setting Proxy Password as Empty\n');
      RdGlobalConfig.proxy.password = '';
      invalidArgs.delete('--proxy-pass');
    }

    // process arguments which decides whether existing logs should be deleted or appended
    index = argv.indexOf('--del-logs');
    if (index !== -1) {
      RdGlobalConfig.deleteExistingLogs = true;
      argv.splice(index, 1);
    } else {
      RdGlobalConfig.deleteExistingLogs = false;
    }

    index = argv.indexOf('--logs-path');
    if (index !== -1) {
      if (CommandLineManager.validArgValue(argv[index + 1])) {
        RdGlobalConfig.logsPath = argv[index + 1];
        argv.splice(index, 2);
      } else {
        invalidArgs.add('--logs-path');
        argv.splice(index, 1);
      }
    }

    var exitAfterProcessArgs = false;
    missingArgs = Array.from(missingArgs);

    // check for any more invalid args which were not processed above
    if (argv.length > 2) {
      argv.slice(2).forEach(function (invalidArg) {
        invalidArgs.add(invalidArg);
      });
    }

    invalidArgs = Array.from(invalidArgs);

    if (invalidArgs.length) {
      console.log('Invalid Argument(s): ', invalidArgs.join(', '), '\n');
      exitAfterProcessArgs = true;
    }

    if (missingArgs.length) {
      console.log('Missing Argument(s): ', missingArgs.join(', '), '\n');
      exitAfterProcessArgs = true;
    }

    // exit the tool by logging the args helper
    if (exitAfterProcessArgs) {
      CommandLineManager.helpForArgs();
      process.exit(0);
    }
  }
};

module.exports = CommandLineManager;
