'use strict';

const path = require('path');
const glob = require('glob');
const _ = require('lodash');

/**
 * globパターンでファイルを検索して、ファイル一覧を返す。  
 * パターンの先頭が ! の場合は、除外するパターンとして機能する。
 * 
 * オプションのrootDirが指定された場合は、patternsはrootDirからの相対パスで検索する。
 * 
 * @param {string|string[]} patterns globパターン
 * @param {object} options オプション
 */
module.exports.findFilesGlob = (patterns, options) => {
  options = _.merge({
    // true=node_modulesは検索対象から除外する
    ignoreNodeDir: true
  }, options);
  let targetPatterns = Array.isArray(patterns) ? patterns: [patterns];
  if (options.rootDir) {
    targetPatterns = targetPatterns.map((pattern) => {
      if (pattern.match(/^!/)) {
        return '!' + options.rootDir + '/' + pattern.substr(1);
      } else {
        return options.rootDir + '/' + pattern;
      }
    });
  }
  if (options.ignoreNodeDir) {
    const rootDir = (options.rootDir) ? options.rootDir: path.resolve('');
    targetPatterns = targetPatterns.concat([
      '!' + rootDir + '/**/node_modules/**/*'
    ]);
  }
  let targetFiles = [];
  targetPatterns.forEach((pattern) => {
    if (pattern.match(/^!/)) {
      const omitFiles = glob.sync(pattern.substr(1));
      targetFiles = targetFiles.filter((file) => {
        return !omitFiles.find((omitFile) => {
          return omitFile === file;
        });
      });
    } else {
      const files = glob.sync(pattern);
      targetFiles = targetFiles.concat(files);
    }
  });
  return targetFiles;
}
