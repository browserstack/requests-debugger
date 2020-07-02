var CommandLineManager = require('../src/commandLine');
var constants = require('../config/constants');
var RdGlobalConfig = constants.RdGlobalConfig;
var expect = require('chai').expect;
var sinon = require('sinon');
var testHelper = require('./testHelper');

describe('CommandLineManager', function () {

  var argv;

  before(function () {
    console.log("NOTE: 'console.log' will be stubbed. In case any test fails, try removing the stub to see the logs");
  });

  after(function () {
    console.log("NOTE: 'console.log' is restored to its original functionality");
  });

  beforeEach(function () {
    argv = ['node', 'file/path/file.js'];
    sinon.stub(process, 'exit');
    testHelper.deleteProxy();
  });

  afterEach(function () {
    process.exit.restore();
  });

  context('Process Arguments', function () {

    it('parse proxy-host and proxy-port params', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy.host).to.eql('host');
      expect(RdGlobalConfig.proxy.port).to.eql(9687);
    });

    it('proxy-port is set to the default value when its not in the expected range', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '99999']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy.host).to.eql('host');
      expect(RdGlobalConfig.proxy.port).to.eql(constants.DEFAULT_PROXY_PORT);
    });

    it('parse proxy-host, proxy-port, proxy-user and proxy-pass', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-user', 'user', '--proxy-pass', 'pass']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy.host).to.eql('host');
      expect(RdGlobalConfig.proxy.port).to.eql(9687);
      expect(RdGlobalConfig.proxy.username).to.eql('user');
      expect(RdGlobalConfig.proxy.password).to.eql('pass');
    });

    it('default proxy port if only proxy host is provided', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy.host).to.eql('host');
      expect(RdGlobalConfig.proxy.port).to.eql(constants.DEFAULT_PROXY_PORT);
    });

    it('empty proxy password if only proxy username is provided', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-user', 'user']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy.host).to.eql('host');
      expect(RdGlobalConfig.proxy.port).to.eql(9687);
      expect(RdGlobalConfig.proxy.username).to.eql('user');
      expect(RdGlobalConfig.proxy.password).to.eql('');
    });

    it("proxy won't be set if proxy host is not provided", function () {
      sinon.stub(console, 'log'); 
      argv = argv.concat(['--proxy-port', '9687']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy).to.eql(undefined);
      sinon.assert.called(process.exit);
    });

    it("proxy auth won't be set if proxy username is not provided", function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-pass', 'pass']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.proxy.host).to.eql('host');
      expect(RdGlobalConfig.proxy.port).to.eql(9687);
      expect(RdGlobalConfig.proxy.username).to.eql(undefined);
      expect(RdGlobalConfig.proxy.password).to.eql(undefined);
    });

    it('defaults to no deletion of existing logs if argument is not provided', function () {
      sinon.stub(console, 'log');
      argv = argv.concat([]);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.DELETE_EXISTING_LOGS).to.be.false;
    });

    it('set to true if argument if provided, i.e. existing logs will be deleted', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--del-logs']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.DELETE_EXISTING_LOGS).to.be.true;
    });

    it("logs help regarding arguments if '--help' is passed irrespective of other arguments", function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--help', '--random-argument']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it("logs version of the tool if '--version' is passed and exits", function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--version']);
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, 'Version:', constants.VERSION);
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it("invalid args will be logged and the tool will exit", function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--wrongArg']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('args (which require values) without values will lead to invalid args and exiting the process', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', '--proxy-port']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('if only --proxy-user is provided instead of the host, it will exit the process with missing args', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-user', 'user']);
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nMissing Argument(s): ', '--proxy-host', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('if --proxy-user is passed without any value, it will mark it as invalid and exit the process', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-user']);
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--proxy-user', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('if --proxy-pass is passed without any value, it will mark it as invalid and exit the process', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-pass']);
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--proxy-pass', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('If no args are passed, it will initiate the tool without any external proxy and append to existing logs', function () {
      CommandLineManager.processArgs([]);
      sinon.assert.notCalled(process.exit);
      expect(RdGlobalConfig.proxy).to.be.undefined;
      expect(RdGlobalConfig.DELETE_EXISTING_LOGS).to.be.false;
    });

    it('--logs-path arg with value', function () {
      argv = argv.concat(['--logs-path', 'randomPath']);
      CommandLineManager.processArgs(argv);
      expect(RdGlobalConfig.logsPath).to.eql('randomPath');
    });

    it('marks --logs-path as invalid if the value is not provided with the arg and exits the process', function () {
      argv = argv.concat(['--logs-path']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    // --port
    it("sets the port of Requests Debugger Tool Proxy using the '--port' argument", function () {
      argv = argv.concat(['--port', '9098']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.RD_HANDLER_PORT).to.eql(9098);
    });

    it('Uses the default port of Requests Debugger Tool Proxy if not provided via arguments', function () {
      sinon.stub(console, 'log');
      var portBeforeParsing = RdGlobalConfig.RD_HANDLER_PORT;
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.RD_HANDLER_PORT).to.eql(portBeforeParsing);
    });

    it("exits with invalid args if port provided doesn't lie in the Max Min Range", function () {
      argv = argv.concat(['--port', '99999']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--port', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('exits with invalid args if the port provided is not a number', function () {
      argv = argv.concat(['--port', 'random string']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--port', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('exits with invalid args if the port arg is provided without any value', function () {
      argv = argv.concat(['--port']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--port', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    // --request-timeout
    it("sets the timeout for the request being fired from the tool using the arg --request-timeout", function () {
      argv = argv.concat(['--request-timeout', '200000']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.CLIENT_REQ_TIMEOUT).to.eql(200000);
    });

    it('Uses the default timeout for requests fired from the tool if not provided via arguments', function () {
      sinon.stub(console, 'log');
      var timeoutBeforeParsing = RdGlobalConfig.CLIENT_REQ_TIMEOUT;
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.CLIENT_REQ_TIMEOUT).to.eql(timeoutBeforeParsing);
    });

    it("exits with invalid args if request timeout provided is negative", function () {
      argv = argv.concat(['--request-timeout', '-1']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--request-timeout', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('exits with invalid args if the request timeout provided is not a number', function () {
      argv = argv.concat(['--request-timeout', 'random string']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--request-timeout', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('exits with invalid args if the --request-timeout arg is provided without any value', function () {
      argv = argv.concat(['--request-timeout']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--request-timeout', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    // --retry-delay
    it("sets the delay after which a failed request should be retried using the arg --retry-delay", function () {
      argv = argv.concat(['--retry-delay', '200']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.RETRY_DELAY).to.eql(200);
    });

    it('Uses the default delay before firing the same request again if the arg --retry-delay is not provided', function () {
      sinon.stub(console, 'log');
      var delayBeforeParsing = RdGlobalConfig.RETRY_DELAY;
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(RdGlobalConfig.RETRY_DELAY).to.eql(delayBeforeParsing);
    });

    it("exits with invalid args if the delay value provided is negative", function () {
      argv = argv.concat(['--retry-delay', '-1']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--retry-delay', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('exits with invalid args if the delay value provided is not a number', function () {
      argv = argv.concat(['--retry-delay', 'random string']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--retry-delay', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('exits with invalid args if the --retry-delay arg is provided without any value', function () {
      argv = argv.concat(['--retry-delay']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, '\nInvalid Argument(s): ', '--retry-delay', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });
  });
});
