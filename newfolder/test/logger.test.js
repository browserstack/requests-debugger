var LogManager = require('../src/logger');
var winston = require('winston');
var sinon = require('sinon');
var expect = require('chai').expect;
var assert = require('chai').assert;

describe('LogManager', function () {
  var mockLogger;

  beforeEach(function () {
    mockLogger = {
      transports: {
        file: {
          filename: 'randomFileName.log'
        }
      },
      info: sinon.spy(),
      error: sinon.spy()
    };
    sinon.stub(winston, 'Logger').returns(mockLogger);
  });

  afterEach(function () {
    winston.Logger.restore();
  });

  context('Winston Logger', function () {
    it('returns winston logger with transports set to file', function () {
      var logger = LogManager.getLogger('randomFileName.log');
      expect(logger.transports.file.filename).to.eql('randomFileName.log');
    });
  });

  context('initializeLogger', function () {
    it("initializes logger and returns 'info' and 'error' functions", function () {
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      sinon.assert.calledOnceWithExactly(mockLogger.info, "************* LOGGER INITIALIZED **************\r\n");
      expect(Object.keys(randomLogger)).to.eql(['info', 'error']);
    });

    it("'info' returned by the initializeLogger calls the 'info' of winston logger in formatted manner with message", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.info("randomTopic", "message", false, {}, 1);
      sinon.assert.calledTwice(mockLogger.info);
      assert.equal(mockLogger.info.firstCall.calledWith("************* LOGGER INITIALIZED **************\r\n"), true);
      assert.equal(mockLogger.info.secondCall.calledWith("message, ", { topic: 'randomTopic', uuid: 1 }), true);
      LogManager.getLogger.restore();
    });

    it("'info' returned by the initializeLogger calls the 'info' of winston logger in formatted manner with message stringified", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.info("randomTopic", "message", true, {}, 1);
      sinon.assert.calledTwice(mockLogger.info);
      assert.equal(mockLogger.info.firstCall.calledWith("************* LOGGER INITIALIZED **************\r\n"), true);
      assert.equal(mockLogger.info.secondCall.calledWith(JSON.stringify("message") + ', ',  { topic: 'randomTopic', uuid: 1 }), true);
      LogManager.getLogger.restore();
    });

    it("'info' returned by the initializeLogger calls the 'info' of winston logger in formatted manner with message and data", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.info("randomTopic", "message", false, { some: "data" }, 1);
      sinon.assert.calledTwice(mockLogger.info);
      assert.equal(mockLogger.info.firstCall.calledWith("************* LOGGER INITIALIZED **************\r\n"), true);
      assert.equal(mockLogger.info.secondCall.calledWith("message, " + JSON.stringify({"some":"data"}), { topic: 'randomTopic', uuid: 1 }), true);
      LogManager.getLogger.restore();
    });

    it("'info' returned by the initializeLogger calls the 'info' of winston logger in formatted manner without topic and uuid", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.info("", "message", false, { some: "data" });
      sinon.assert.calledTwice(mockLogger.info);
      assert.equal(mockLogger.info.firstCall.calledWith("************* LOGGER INITIALIZED **************\r\n"), true);
      assert.equal(mockLogger.info.secondCall.calledWith("message, " + JSON.stringify({"some":"data"}), { topic: '', uuid: '' }), true);
      LogManager.getLogger.restore();
    });

    it("'error' returned by the initializeLogger calls the 'error' of winston logger in formatted manner with message", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.error("randomTopic", "message", false, {}, 1);
      sinon.assert.calledOnce(mockLogger.error);
      assert.equal(mockLogger.error.firstCall.calledWith("message, ", { topic: 'randomTopic', uuid: 1 }), true);
      LogManager.getLogger.restore();
    });

    it("'error' returned by the initializeLogger calls the 'error' of winston logger in formatted manner with message stringified", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.error("randomTopic", "message", true, {}, 1);
      sinon.assert.calledOnce(mockLogger.error);
      assert.equal(mockLogger.error.firstCall.calledWith(JSON.stringify("message") + ', ',  { topic: 'randomTopic', uuid: 1 }), true);
      LogManager.getLogger.restore();
    });

    it("'error' returned by the initializeLogger calls the 'error' of winston logger in formatted manner with message and data", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.error("randomTopic", "message", false, { some: "data" }, 1);
      sinon.assert.calledOnce(mockLogger.error);
      assert.equal(mockLogger.error.firstCall.calledWith("message, " + JSON.stringify({"some":"data"}), { topic: 'randomTopic', uuid: 1 }), true);
      LogManager.getLogger.restore();
    });

    it("'error' returned by the initializeLogger calls the 'error' of winston logger in formatted manner without topic and uuid", function () {
      sinon.stub(LogManager, 'getLogger').returns(mockLogger);
      var randomLogger = LogManager.initializeLogger('randomFileName.log');
      randomLogger.error("", "message", false, { some: "data" });
      sinon.assert.calledOnce(mockLogger.error);
      assert.equal(mockLogger.error.firstCall.calledWith("message, " + JSON.stringify({"some":"data"}), { topic: '', uuid: '' }), true);
      LogManager.getLogger.restore();
    });
  });
});
