'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const extend = require('util')._extend;

let cacheConf;

module.exports.confFile = path.resolve('') + '/a5doc.yml';

module.exports.read = function(confFile) {
  if (confFile) {
    module.exports.confFile = confFile;
  }
  cacheConf = yaml.safeLoad(fs.readFileSync(module.exports.confFile, 'utf8'));
  return cacheConf;
}

module.exports.get = function() {
  if (!cacheConf) {
    module.exports.read();
  }
  return cacheConf;
}

module.exports._extend = function(options) {
  if (!cacheConf) {
    cacheConf = {};
  }
  cacheConf = extend(cacheConf, options);
}
