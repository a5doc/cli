'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const extend = require('util')._extend;
const confFile = path.resolve('') + '/a5doc.yml';

let cacheConf;

module.exports = function($options) {
  if (!cacheConf) {
    cacheConf = yaml.safeLoad(fs.readFileSync(confFile, 'utf8'));
    cacheConf = extend(cacheConf, $options);
  }
  return cacheConf;
}
