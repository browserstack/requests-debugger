var LinuxStats = require('../../src/stats/linuxStats');
var os = require('os');
var constants = require('../../config/constants');
var expect = require('chai').expect;
var sinon = require('sinon');
var cp = require('child_process');
var fs = require('fs');
var Utils = require('../../src/utils');

describe('LinuxStats', function () {
  context('CPU stats', function () {
    it('callbacks with the result of cpu stats', function () {
      var stats = "CPU Stats Generated";
      var statsWithHeaderFooter = "Header" + os.EOL + stats + os.EOL + "Footer" + os.EOL;

      sinon.stub(cp, 'exec').callsArgWith(1, null, stats);
      sinon.stub(Utils, 'generateHeaderAndFooter').returns(statsWithHeaderFooter);

      LinuxStats.cpu(function (result) {
        expect(result).to.eql(statsWithHeaderFooter);
      });

      cp.exec.restore();
      Utils.generateHeaderAndFooter.restore();
    });

    it('callbacks with proper message when no stats are available', function () {
      sinon.stub(cp, 'exec').callsArgWith(1, "err", null);

      LinuxStats.cpu(function (result) {
        expect(result).to.eql(constants.NO_REPORT_GENERATED + 'CPU' + os.EOL);
      });

      cp.exec.restore();
    });
  });

  context('Mem Stats', function () {
    it('callbacks with result of mem stats', function () {
      var stats = "MemTotal:102400 KB\nMemFree:51200 KB\nSwapTotal:102400 KB\nSwapFree:51200 KB";
      sinon.stub(os, 'totalmem').returns(100 * 1024 * 1024);
      sinon.stub(os, 'freemem').returns(50 * 1024 * 1024);
      sinon.stub(Utils, 'beautifyObject');
      sinon.stub(fs, 'readFile').callsArgWith(1, null, stats);

      var memStats = {
        total: 100 * 1024 * 1024,
        free: 50 * 1024 * 1024,
        used: 50 * 1024 * 1024,
        swapTotal: 100 * 1024 * 1024,
        swapUsed: 50 * 1024 * 1024,
        swapFree: 50 * 1024 * 1024
      };
      /* eslint-disable-next-line no-unused-vars */
      LinuxStats.mem(function (result) {
        sinon.assert.calledWith(Utils.beautifyObject, memStats, "Memory", "Bytes");
      });

      os.totalmem.restore();
      os.freemem.restore();
      Utils.beautifyObject.restore();
      fs.readFile.restore();
    });

    it('callbacks with the total, free & used mem stats except swap if error occurs in fs command', function () {
      sinon.stub(fs, 'readFile').callsArgWith(1, "err", null);
      sinon.stub(Utils, 'beautifyObject');
      sinon.stub(os, 'totalmem').returns(100 * 1024 * 1024);
      sinon.stub(os, 'freemem').returns(50 * 1024 * 1024);

      var memStats = {
        total: 100 * 1024 * 1024,
        free: 50 * 1024 * 1024,
        used: 50 * 1024 * 1024,
        swapTotal: 0,
        swapUsed: 0,
        swapFree: 0
      };

      /* eslint-disable-next-line no-unused-vars */
      LinuxStats.mem(function (result) {
        sinon.assert.calledWith(Utils.beautifyObject, memStats, "Memory", "Bytes");
      });

      os.totalmem.restore();
      os.freemem.restore();
      fs.readFile.restore();
      Utils.beautifyObject.restore();
    });
  });

  context('Network Stats', function () {
    it('callbacks with the stats content of multiple commands', function () {
      var results = [{
        content: 'resultOne',
        generatedAt: new Date().toISOString()
      }, {
        content: 'resultTwo',
        generatedAt: new Date().toISOString()
      }, {
        content: 'resultThree',
        generatedAt: new Date().toISOString()
      }];

      sinon.stub(Utils, 'execMultiple').callsArgWith(1, results);
      sinon.stub(Utils, 'generateHeaderAndFooter').returns('headerFooterContent');

      LinuxStats.network(function (result) {
        sinon.assert.calledThrice(Utils.generateHeaderAndFooter);
        expect(result).to.eql('headerFooterContent'.repeat(3));
      });
      Utils.generateHeaderAndFooter.restore();
      Utils.execMultiple.restore();
    });
  });
});
