var WinStats = require('../../src/stats/winStats');
var os = require('os');
var constants = require('../../config/constants');
var expect = require('chai').expect;
var sinon = require('sinon');
var cp = require('child_process');
var Utils = require('../../src/utils');

describe('WinStats', function () {
  beforeEach(function () {
    WinStats.wmicPath = null;
    sinon.stub(Utils, 'getWmicPath').returns('path/to/wmic.exe ');
  });

  afterEach(function () {
    Utils.getWmicPath.restore();
  });

  context('CPU Stats', function () {
    it('callbacks with the result of cpu stats', function () {
      var stats = "CPU Stats Generated";
      var statsWithHeaderFooter = "Header" + os.EOL + stats + os.EOL + "Footer" + os.EOL;

      sinon.stub(cp, 'exec').callsArgWith(1, null, stats);
      sinon.stub(Utils, 'generateHeaderAndFooter').returns(statsWithHeaderFooter);

      WinStats.cpu(function (result) {
        expect(result).to.eql(statsWithHeaderFooter);
      });

      cp.exec.restore();
      Utils.generateHeaderAndFooter.restore();
    });

    it('callbacks with proper message when no stats are available', function () {
      sinon.stub(cp, 'exec').callsArgWith(1, "err", null);

      WinStats.cpu(function (result) {
        expect(result).to.eql(constants.STATIC_MESSAGES.NO_REPORT_GENERATED + 'CPU' + os.EOL);
      });

      cp.exec.restore();
    });
  });

  context('Mem Stats', function () {
    it('callbacks with result of mem stats', function () {
      var execOutput = "AllocatedBaseSize  CurrentUsage  \r\r\n100               50            \r\r\n\r\r\n";
      sinon.stub(Utils, 'beautifyObject');
      sinon.stub(cp, 'exec').callsArgWith(1, null, execOutput);
      sinon.stub(os, 'totalmem').returns(100 * 1024 * 1024);
      sinon.stub(os, 'freemem').returns(50 * 1024 * 1024);

      var memStats = {
        total: 100 * 1024 * 1024,
        free: 50 * 1024 * 1024,
        used: 50 * 1024 * 1024,
        swapTotal: 100 * 1024 * 1024,
        swapUsed: 50 * 1024 * 1024,
        swapFree: 50 * 1024 * 1024
      };
      /* eslint-disable-next-line no-unused-vars */
      WinStats.mem(function (result) {
        sinon.assert.calledWith(Utils.beautifyObject, memStats, "Memory", "Bytes");
      });

      os.totalmem.restore();
      os.freemem.restore();
      cp.exec.restore();
      Utils.beautifyObject.restore();
    });

    it('callbacks with the total, free & used mem stats except swap if error occurs in fs command', function () {
      sinon.stub(Utils, 'beautifyObject');
      sinon.stub(cp, 'exec').callsArgWith(1, 'err', null);
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
      WinStats.mem(function (result) {
        sinon.assert.calledWith(Utils.beautifyObject, memStats, "Memory", "Bytes");
      });

      os.totalmem.restore();
      os.freemem.restore();
      cp.exec.restore();
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
      }, {
        content: 'resultFour',
        generatedAt: new Date().toISOString()
      }, {
        content: 'resultFive',
        generatedAt: new Date().toISOString()
      }];

      sinon.stub(Utils, 'execMultiple').callsArgWith(1, results);
      sinon.stub(Utils, 'generateHeaderAndFooter').returns('headerFooterContent');

      WinStats.network(function (result) {
        sinon.assert.callCount(Utils.generateHeaderAndFooter, 5);
        expect(result).to.eql('headerFooterContent'.repeat(5));
      });
      Utils.generateHeaderAndFooter.restore();
      Utils.execMultiple.restore();
    });
  });
});
