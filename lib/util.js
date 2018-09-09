'use strict';

const path = require('path');
const glob = require('glob');

/**
 * globパターンでファイルを検索して、ファイル一覧を返す。  
 * パターンの先頭が ! の場合は、除外するパターンとして機能する。
 * @param {string|string[]} patterns globパターン
 */
module.exports.findFilesGlob = (patterns) => {
  const targetPatterns = Array.isArray(patterns) ? patterns: [patterns];
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

/**
 * MDファイル名をエスケープ加工する。  
 * ファイル名にSPがある場合は、- に置き換える。  
 * @param {string} filename MDファイル名
 */
module.exports.mdFileName = (filename) => {
  return filename.replace(' ', '-');
}