const path = require('path');
const stream = require('stream');
const fs = require('fs');
const unzipper = require('unzipper');
const chai = require('chai');
const _ = require('lodash');
const { runServerless } = require('./e2eUtils');

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;

async function unzipArtefacts(archivePath) {
  const files = {};

  await new Promise((resolve, reject) => {
    fs.createReadStream(archivePath)
      .pipe(unzipper.Parse())
      .pipe(
        stream.Transform({
          objectMode: true,
          transform: async function (entry, e, cb) {
            if (entry.path.startsWith('node_modules/')) {
              files.node_modules = true;
              entry.autodrain();
              cb();
              return;
            }

            if (entry.type === 'Directory') {
              files[entry.path] = true;
              entry.autodrain();
              cb();
              return;
            }

            const content = await entry.buffer();
            files[entry.path] = String(content);
            entry.autodrain();
            cb();
          }
        })
      )
      .on('error', reject)
      .on('finish', resolve);
  });

  return files;
}

describe('end-to-end testing', () => {
  it('should support include-external-npm-packages example', async function () {
    if (_.startsWith(process.version, 'v10')) {
      // Serverless v3 doesn't support node 10
      this.skip();
    }

    const fixture = 'include-external-npm-packages';
    const result = await runServerless({ fixture });

    const outputDir = path.join(result.servicePath, '.serverless');
    const archivePath = path.join(outputDir, `${fixture}.zip`);
    const files = await unzipArtefacts(archivePath);

    expect(files.node_modules).to.equal(true);
    expect(JSON.parse(files['package.json'])).to.deep.equal({
      name: fixture,
      version: '1.0.0',
      description: `Packaged externals for ${fixture}`,
      private: true,
      scripts: {},
      dependencies: {
        fbgraph: '^1.4.4'
      }
    });
    expect(files['handler.js']).to.not.be.empty;
  }).timeout(300000);

  it('should support include-external-npm-packages-lock-file example', async function () {
    if (_.startsWith(process.version, 'v10')) {
      // Serverless v3 doesn't support node 10
      this.skip();
    }

    const fixture = 'include-external-npm-packages-lock-file';
    const result = await runServerless({ fixture });

    const outputDir = path.join(result.servicePath, '.serverless');
    const archivePath = path.join(outputDir, `${fixture}.zip`);
    const files = await unzipArtefacts(archivePath);

    // fbgraph is not included because of tree-shaking
    expect(JSON.parse(files['package.json'])).to.deep.equal({
      name: fixture,
      version: '1.0.0',
      description: `Packaged externals for ${fixture}`,
      private: true,
      scripts: {},
      dependencies: {
        // We should use fix version to respect lock file
        lodash: '^4.17.21'
      }
    });
    expect(files['handler.js']).to.not.be.empty;
    expect(files.node_modules).to.equal(true);
  }).timeout(300000);
});
