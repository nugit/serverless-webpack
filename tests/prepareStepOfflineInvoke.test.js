'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');
const chai = require('chai');
const sinon = require('sinon');
const Serverless = require('serverless');

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;

describe('prepareStepOfflineInvoke', () => {
  let serverless;
  let baseModule;
  let module;
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    sandbox.usingPromise(BbPromise.Promise);

    baseModule = require('../lib/prepareStepOfflineInvoke');
    Object.freeze(baseModule);
  });

  beforeEach(() => {
    serverless = new Serverless({ commands: ['print'], options: {}, serviceDir: null });
    serverless.cli = {
      log: sandbox.stub()
    };
    sandbox.stub(serverless.pluginManager, 'spawn');
    module = _.assign(
      {
        serverless,
        options: {}
      },
      baseModule
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should set service packaging explicitly', () => {
    serverless.pluginManager.spawn.resolves();
    serverless.config.servicePath = 'myPath';
    module.webpackOutputPath = '.';
    module.serverless.service.package = {};

    return expect(module.prepareStepOfflineInvoke()).to.be.fulfilled.then(() => {
      expect(module.serverless.service.package).to.have.a.property('individually').that.is.false;
      return null;
    });
  });

  it('should switch to service packaging', () => {
    serverless.pluginManager.spawn.resolves();
    serverless.config.servicePath = 'myPath';
    module.webpackOutputPath = '.';
    module.serverless.service.package = {
      individually: true
    };

    return expect(module.prepareStepOfflineInvoke()).to.be.fulfilled.then(() => {
      expect(module.serverless.service.package).to.have.a.property('individually').that.is.false;
      return null;
    });
  });

  it('should spawn webpack:validate', () => {
    serverless.pluginManager.spawn.resolves();
    serverless.config.servicePath = 'myPath';
    module.webpackOutputPath = '.';

    return expect(module.prepareStepOfflineInvoke()).to.be.fulfilled.then(() => {
      expect(serverless.pluginManager.spawn).to.have.been.calledOnce;
      expect(serverless.pluginManager.spawn).to.have.been.calledWithExactly('webpack:validate');
      return null;
    });
  });

  it('should reject if spawn rejects', () => {
    serverless.pluginManager.spawn.returns(BbPromise.reject(new Error('spawn failed')));
    serverless.config.servicePath = 'myPath';
    module.webpackOutputPath = '.';

    return expect(module.prepareStepOfflineInvoke()).to.be.rejectedWith('spawn failed');
  });

  it('should set location if not given by user', () => {
    serverless.pluginManager.spawn.resolves();
    serverless.config.servicePath = '.';
    module.webpackOutputPath = '.';

    return expect(module.prepareStepOfflineInvoke()).to.be.fulfilled.then(() => {
      expect(serverless.service).to.have.a.nested.property('custom.stepFunctionsOffline.location', 'service');
      return null;
    });
  });

  it('should keep location if set in service config', () => {
    serverless.pluginManager.spawn.resolves();
    serverless.config.servicePath = '.';
    module.webpackOutputPath = '.';
    _.set(module.serverless, 'service.custom.stepFunctionsOffline.location', 'myLocation');

    return expect(module.prepareStepOfflineInvoke()).to.be.fulfilled.then(() => {
      expect(serverless.service).to.have.a.nested.property('custom.stepFunctionsOffline.location', 'myLocation');
      return null;
    });
  });

  it('should keep location if set in options', () => {
    serverless.pluginManager.spawn.resolves();
    serverless.config.servicePath = '.';
    module.webpackOutputPath = '.';
    module.options = {
      location: 'myLocation'
    };

    return expect(module.prepareStepOfflineInvoke()).to.be.fulfilled.then(() => {
      expect(serverless.service).to.not.have.a.nested.property('custom.stepFunctionsOffline.location');
      return null;
    });
  });
});
