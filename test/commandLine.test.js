var CommandLineManager = require('../src/commandLine');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var expect = require('chai').expect;
var sinon = require('sinon');

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
    NwtGlobalConfig.deleteProxy();
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
      expect(NwtGlobalConfig.proxy.host).to.eql('host');
      expect(NwtGlobalConfig.proxy.port).to.eql('9687');
    });

    it('parse proxy-host, proxy-port, proxy-user and proxy-pass', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-user', 'user', '--proxy-pass', 'pass']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(NwtGlobalConfig.proxy.host).to.eql('host');
      expect(NwtGlobalConfig.proxy.port).to.eql('9687');
      expect(NwtGlobalConfig.proxy.username).to.eql('user');
      expect(NwtGlobalConfig.proxy.password).to.eql('pass');
    });

    it('default proxy port if only proxy host is provided', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(NwtGlobalConfig.proxy.host).to.eql('host');
      expect(NwtGlobalConfig.proxy.port).to.eql(constants.DEFAULT_PROXY_PORT);
    });

    it('empty proxy password if only proxy username is provided', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-user', 'user']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(NwtGlobalConfig.proxy.host).to.eql('host');
      expect(NwtGlobalConfig.proxy.port).to.eql('9687');
      expect(NwtGlobalConfig.proxy.username).to.eql('user');
      expect(NwtGlobalConfig.proxy.password).to.eql('');
    });

    it("proxy won't be set if proxy host is not provided", function () {
      sinon.stub(console, 'log'); 
      argv = argv.concat(['--proxy-port', '9687']);
       CommandLineManager.processArgs(argv);
       console.log.restore();
       expect(NwtGlobalConfig.proxy).to.eql(undefined);
       sinon.assert.called(process.exit);
    });

    it("proxy auth won't be set if proxy username is not provided", function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-pass', 'pass']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(NwtGlobalConfig.proxy.host).to.eql('host');
      expect(NwtGlobalConfig.proxy.port).to.eql('9687');
      expect(NwtGlobalConfig.proxy.username).to.eql(undefined);
      expect(NwtGlobalConfig.proxy.password).to.eql(undefined);
    });

    it('defaults to no deletion of existing logs if argument is not provided', function () {
      sinon.stub(console, 'log');
      argv = argv.concat([]);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(NwtGlobalConfig.deleteExistingLogs).to.be.false;
    });

    it('set to true if argument if provided, i.e. existing logs will be deleted', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--del-logs']);
      CommandLineManager.processArgs(argv);
      console.log.restore();
      expect(NwtGlobalConfig.deleteExistingLogs).to.be.true;
    });

    it("logs help regarding arguments if '--help' is passed irrespective of other arguments", function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--help', '--random-argument']);
      CommandLineManager.processArgs(argv);
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
      sinon.assert.calledWith(console.log, 'Missing Argument(s): ', '--proxy-host', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('if --proxy-user is passed without any value, it will mark it as invalid and exit the process', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-user']);
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, 'Invalid Argument(s): ', '--proxy-user', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('if --proxy-pass is passed without any value, it will mark it as invalid and exit the process', function () {
      sinon.stub(console, 'log');
      argv = argv.concat(['--proxy-pass']);
      CommandLineManager.processArgs(argv);
      sinon.assert.calledWith(console.log, 'Invalid Argument(s): ', '--proxy-pass', '\n');
      console.log.restore();
      sinon.assert.called(process.exit);
    });

    it('If no args are passed, it will initiate the tool without any external proxy and append to existing logs', function () {
      CommandLineManager.processArgs([]);
      sinon.assert.notCalled(process.exit);
      expect(NwtGlobalConfig.proxy).to.be.undefined;
      expect(NwtGlobalConfig.deleteExistingLogs).to.be.false;
    });

    it('--logs-path arg with value', function () {
      argv = argv.concat(['--logs-path', 'randomPath']);
      CommandLineManager.processArgs(argv);
      expect(NwtGlobalConfig.logsPath).to.eql('randomPath');
    });

    it('marks --logs-path as invalid if the value is not provided with the arg and exits the process', function () {
      argv = argv.concat(['--logs-path']);
      sinon.stub(console, 'log');
      CommandLineManager.processArgs(argv);
      console.log.restore();
      sinon.assert.called(process.exit);
    });
  });
});
