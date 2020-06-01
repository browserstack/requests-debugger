var CommandLineManager = require('../src/commandLine');
var constants = require('../config/constants');
var NwtGlobalConfig = constants.NwtGlobalConfig;
var expect = require('chai').expect;

describe('CommandLineManager', function () {
  context('processArgs', function () {
    context('Proxy Arguments', function () {
      beforeEach(function () {
        NwtGlobalConfig.deleteProxy();
      });
  
      it('parse proxy-host and proxy-port params', function () {
        var argv = ['--proxy-host', 'host', '--proxy-port', '9687'];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.proxy.host).to.eql('host');
        expect(NwtGlobalConfig.proxy.port).to.eql('9687');
      });
  
      it('parse proxy-host, proxy-port, proxy-user and proxy-pass', function () {
        var argv = ['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-user', 'user', '--proxy-pass', 'pass'];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.proxy.host).to.eql('host');
        expect(NwtGlobalConfig.proxy.port).to.eql('9687');
        expect(NwtGlobalConfig.proxy.username).to.eql('user');
        expect(NwtGlobalConfig.proxy.password).to.eql('pass');
      });
  
      it('default proxy port if only proxy host is provided', function () {
        var argv = ['--proxy-host', 'host'];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.proxy.host).to.eql('host');
        expect(NwtGlobalConfig.proxy.port).to.eql(constants.DEFAULT_PROXY_PORT);
      });
  
      it('empty proxy password if only proxy username is provided', function () {
        var argv = ['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-user', 'user'];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.proxy.host).to.eql('host');
        expect(NwtGlobalConfig.proxy.port).to.eql('9687');
        expect(NwtGlobalConfig.proxy.username).to.eql('user');
        expect(NwtGlobalConfig.proxy.password).to.eql('');
      });
  
      it("proxy won't be set if proxy host is not provided", function () {
         var argv = ['--proxy-port', '9687'];
         CommandLineManager.processArgs(argv);
         expect(NwtGlobalConfig.proxy).to.eql(undefined);
      });
  
      it("proxy auth won't be set if proxy username is not provided", function () {
        var argv = ['--proxy-host', 'host', '--proxy-port', '9687', '--proxy-pass', 'pass'];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.proxy.host).to.eql('host');
        expect(NwtGlobalConfig.proxy.port).to.eql('9687');
        expect(NwtGlobalConfig.proxy.username).to.eql(undefined);
        expect(NwtGlobalConfig.proxy.password).to.eql(undefined);
      });
    });

    context('Delete Existing Logs Argument', function () {
      it('defaults to no deletion of existing logs if argument is not provided', function () {
        var argv = [];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.deleteExistingLogs).to.be.false;
      });

      it('set to true if argument if provided, i.e. existing logs will be deleted', function () {
        var argv = ['--del-logs'];
        CommandLineManager.processArgs(argv);
        expect(NwtGlobalConfig.deleteExistingLogs).to.be.true;
      });
    });
  });
});