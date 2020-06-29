var StatsFactory = require('../../src/stats/statsFactory');
var expect = require('chai').expect;

describe('StatsFactory', function () {
  context('Fetches handler based on the platform provided', function () {
    it('Mac Platform Handler', function () {
      var MacHandler = StatsFactory.getHandler('darwin');
      expect(MacHandler.description).to.eql('System and Network Stats for Mac');
    });

    it('Win Platform Handler', function () {
      var WinHandler = StatsFactory.getHandler('win');
      expect(WinHandler.description).to.eql('System and Network Stats for Windows');
    });

    it('Linux Stats Handler', function () {
      var LinuxHandler = StatsFactory.getHandler('linux');
      expect(LinuxHandler.description).to.eql('System and Network Stats for Linux');
    });

    it('Generic Stats Handler, i.e. Base Stats', function () {
      var BaseStats = StatsFactory.getHandler('randomPlatform');
      expect(BaseStats.description).to.eql('Base Object for System & Network Stats');
    });
  });
});
