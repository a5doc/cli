'use strict';

/**
 * MDの書式を整形する。  
 * 
 * @param {string} text MDのテキスト
 * @returns 整形されたテキスト
 */
module.exports.fixes = function(text) {
  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n');
}

/**
 * MDファイル名をエスケープ加工する。  
 * ファイル名にSPがある場合は、- に置き換える。  
 * @param {string} filename MDファイル名
 */
module.exports.mdFileName = (filename) => {
  return filename.replace(' ', '-');
}

/**
 * MDのリンク内のエスケープ処理。
 * 
 * `[hoge](fuga.md)`と出力する場合の`fuga.md`を無害化する。  
 * 例えば、fuga.mdの部分が、fuga(piyo).mdとファイル名に括弧が含まれている場合にエスケープ処理が必要となる。
 * 
 * @param {string} linkPath リンクのパス
 * @returns エスケープされたリンクのパス
 */
module.exports.escapeLink = function(linkPath) {
  return linkPath.replace(/([\(\)])/g, '\\$1');
}
