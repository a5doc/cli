'use strict';

const path = require('path');
const glob = require('glob');

module.exports.findFilesGlob = (patterns) => {
  const targetPatterns = Array.isArray(patterns) ? patterns: [patterns];
  let targetFiles = [];
  targetPatterns.forEach((pattern) => {
    const files = glob.sync(pattern);
    targetFiles = targetFiles.concat(files);
  });
  return targetFiles;
}