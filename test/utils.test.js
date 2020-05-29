
var chai = require('chai');
var sinon = require('sinon');
var Utils = require('../src/utils');
var os = require('os');
var fs = require('fs');
var cp = require('child_process');
var assert = chai.assert;
var expect = chai.expect;

describe('Utils', function () {
  context('proxyAuthToBase64', function () {
    it('should return the auth header value when proxy object is passed with username and password', function () {
      var proxyObj = {
        username: "general",
        password: "fancy"
      }
      var base64 = Buffer.from(proxyObj.username + ':' + proxyObj.password).toString('base64');
      expect(Utils.proxyAuthToBase64(proxyObj)).to.eql('Basic ' + base64);
    });

    it('should return the auth header value when auth params are passed in user:pass format', function () {
      var auth = 'general:fancy';
      var base64 = Buffer.from(auth).toString('base64');
      expect(Utils.proxyAuthToBase64(auth)).to.eql('Basic ' + base64);
    });
  });

  context('fetchPropertyValue', function () {
    it('should fetch the given property value where the content is an array of key value pairs separated by a separator', function () {
      var content = [
        'keyOne :valueOne',
        'keyTwo:  valueTwo'
      ];
      var value = Utils.fetchPropertyValue(content, 'keytwo', ':');
      expect(value).to.eql('valuetwo');
    });

    it('should return empty string if no key found', function () {
      var content = [
        'keyOne :valueOne',
        'keyTwo:  valueTwo'
      ];
      var value = Utils.fetchPropertyValue(content, 'keythree', ':');
      expect(value).to.eql('');
    });

    it('should return empty string if key found with no value', function () {
      var content = [
        'keyOne :valueOne',
        'keyTwo'
      ];
      var value = Utils.fetchPropertyValue(content, 'keytwo', ':');
      expect(value).to.eql('');
    });
  });

  context('formatAndBeautifyLine', function () {
    it('should prefix and suffix the line with the given values and make it equal to the given length', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '=', '=', 60, false);
      expect(beautifiedLine).to.eql('============ Hello, This is Network Utility Tool =============');
    });

    it('should prefix the line with the given values and make it equal to the given length', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '=', '', 60, false);
      expect(beautifiedLine).to.eql('========================= Hello, This is Network Utility Tool');
    });

    it('should suffix the line with the given values and make it equal to the given length', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '', '=', 60, false);
      expect(beautifiedLine).to.eql('Hello, This is Network Utility Tool =========================');
    });

    it('should prefix and suffix the line with the given values and make it equal to the given length with a newline', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '=', '=', 60, true);
      expect(beautifiedLine).to.eql('============ Hello, This is Network Utility Tool =============' + os.EOL);
    });

    it('should prefix the line with the given values and make it equal to the given length with a newline', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '=', '', 60, true);
      expect(beautifiedLine).to.eql('========================= Hello, This is Network Utility Tool' + os.EOL);
    });

    it('should suffix the line with the given values and make it equal to the given length with a newline', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '', '=', 60, true);
      expect(beautifiedLine).to.eql('Hello, This is Network Utility Tool =========================' + os.EOL);
    });

    it('should return the line as it is in case the desired length is lesser than the actual line length', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '', '=', 10, false);
      expect(beautifiedLine).to.eql('Hello, This is Network Utility Tool');
    });

    it('should return the line as it is in case the desired length is lesser than the actual line length with a newline', function () {
      var lineToBeautify = "Hello, This is Network Utility Tool";
      var beautifiedLine = Utils.formatAndBeautifyLine(lineToBeautify, '', '=', 10, true);
      expect(beautifiedLine).to.eql('Hello, This is Network Utility Tool' + os.EOL);
    });
  });

  context('generateHeaderAndFooter', function () {

  });

  context('safeToString', function () {
    it('should return string even if .toString() fails', function () {
      var nonStringableValue = null;
      var stringifiedValue = Utils.safeToString(nonStringableValue);
      expect(stringifiedValue).to.eql('null');
    });
  });

  context('isValidCallback', function () {
    it('should return true if callback is a function', function () {
      var callback = function () {};
      expect(Utils.isValidCallback(callback)).to.be.true;
    });

    it('should return false if callback is other than function', function () {
      var callback = 'I am not a function';
      expect(Utils.isValidCallback(callback)).to.be.false;
    });
  });

  context('getWmicPath', function () {
    var prevWINDIR = process.env.WINDIR;
    beforeEach(function () {
      process.env.WINDIR = 'some\\directory';
    });

    afterEach(function () {
      process.env.WINDIR = prevWINDIR;
    });

    it('should return wmic path if file exists at the expected location', function () {
      sinon.stub(os, 'type').returns('Windows_NT');
      sinon.stub(fs, 'existsSync').returns(true);
      var wmicPath = Utils.getWmicPath();
      expect(wmicPath).to.eql('some\\directory\\system32\\wbem\\wmic.exe ');
      os.type.restore();
      fs.existsSync.restore();
    });

    it("if wmic doesn't exists in the desired location, it will search and return the path", function () {
      sinon.stub(os, 'type').returns('Windows_NT');
      sinon.stub(fs, 'existsSync').returns(false);
      sinon.stub(cp, 'execSync').returns('some\\directory\\system32\\wbem\\wmic.exe\r\n');
      var wmicPath = Utils.getWmicPath();
      expect(wmicPath).to.eql('some\\directory\\system32\\wbem\\wmic.exe ');
      os.type.restore();
      fs.existsSync.restore();
      cp.execSync.restore();
    });

    it("if wmic doesn't exist in the desired path and is also not found by searching, it shall return 'wmic '", function () {
      sinon.stub(os, 'type').returns('Windows_NT');
      sinon.stub(fs, 'existsSync').returns(false);
      sinon.stub(cp, 'execSync').returns('');
      var wmicPath = Utils.getWmicPath();
      expect(wmicPath).to.eql('wmic ');
      os.type.restore();
      fs.existsSync.restore();
      cp.execSync.restore();
    });

    it("should return 'wmic ' if searching for path raises an exception", function () {
      sinon.stub(os, 'type').returns('Windows_NT');
      sinon.stub(fs, 'existsSync').returns(false);
      sinon.stub(cp, 'execSync').returns(null);
      var wmicPath = Utils.getWmicPath();
      expect(wmicPath).to.eql('wmic ');
      os.type.restore();
      fs.existsSync.restore();
      cp.execSync.restore();
    });

    it('should throw error if platform is not windows', function () {
      sinon.stub(os, 'type').returns('NON_WINDOWS');
      expect(function () { Utils.getWmicPath() }).to.throw("Not Windows Platform");
      os.type.restore();
    });
  });

  context('execMultiple', function () {
    it('should throw error if the commands provided are not in an array', function () {
      var commands = "it's not going to work";
      expect(function () { Utils.execMultiple(commands) }).to.throw("COMMANDS_IS_NOT_AN_ARRAY");
    });

    it('should execute and return results array', function () {
      var commands = ['commandOne', 'commandTwo'];
      sinon.stub(cp, 'exec').callsArgWith(1, null, 'executed');
      Utils.execMultiple(commands, function (resultArray) {
        resultArray.forEach(function (result) {
          expect(result.content).to.eql('executed');
        });
      });
      cp.exec.restore();
    });

    it('should execute and return results array even if err occurs', function () {
      var commands = ['commandOne', 'commandTwo'];
      sinon.stub(cp, 'exec').callsArgWith(1, 'some error');
      Utils.execMultiple(commands, function (resultArray) {
        resultArray.forEach(function (result) {
          expect(result.content).to.eql('NO_RESULT_GENERATED' + os.EOL);
        });
      });
      cp.exec.restore();
    });
  });
});
