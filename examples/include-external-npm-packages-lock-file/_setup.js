'use strict';

const path = require('path');

module.exports = async (originalFixturePath, fixturePath, utils) => {
  const pluginPath = path.resolve(originalFixturePath, '..', '..');

  const SLS_CONFIG_PATH = path.join(fixturePath, 'serverless.yml');
  const WEBPACK_CONFIG_PATH = path.join(fixturePath, 'webpack.config.js');
  const PACKAGE_JSON_PATH = path.join(fixturePath, 'package.json');
  const LOCK_PATH = path.join(fixturePath, 'package-lock.json');

  await Promise.all([
    utils.replaceInFile(SLS_CONFIG_PATH, '- serverless-webpack', `- ${pluginPath}`),
    utils.replaceInFile(WEBPACK_CONFIG_PATH, "'serverless-webpack'", `'${pluginPath}'`),
    utils.replaceInFile(PACKAGE_JSON_PATH, 'file:../..', `file:${pluginPath}`),
    utils.replaceInFile(LOCK_PATH, '../..', `${pluginPath}`)
  ]);

  return utils.spawnProcess('yarn', ['install'], { cwd: __dirname });
};
