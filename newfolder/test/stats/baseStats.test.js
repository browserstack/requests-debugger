var BaseStats = require('../../src/stats/baseStats');
var expect = require('chai').expect;

describe('BaseStats', function () {
  context('Default Functions', function () {
    it("should callback with 'CPU Stats Not Yet Implemented' for cpu function", function () {
      BaseStats.cpu(function (result) {
        expect(result).to.eql('CPU Stats Not Yet Implemented');
      });
    });

    it("should callback with 'Mem Stats Not Yet Implemented' for mem function", function () {
      BaseStats.mem(function (result) {
        expect(result).to.eql('Mem Stats Not Yet Implemented');
      });
    });

    it("should callback with 'Network Stats Not Yet Implemented' for network function", function () {
      BaseStats.network(function (result) {
        expect(result).to.eql('Network Stats Not Yet Implemented');
      });
    });
  });
});
