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
 * MDのリンクを作成する。  
 * linkがundefinedの場合はtitleのみ。  
 * 例:linkがあるとき）[title](link)  
 * 例:linkがないとき）title  
 * @param {string} title 表示テキスト
 * @param {string} link 参照先
 */
module.exports.mdLink = (title, link) => {
  if (link) {
    return '[' + title + '](' + module.exports.escapeLink(link) +')';
  } else {
    return title;
  }
}

/**
 * リストのインデントを作成する。  
 * @param {integer} level インデントレベル（0～）
 */
module.exports.listIndent = (level) => {
  const mark = level === 0 ? '*': '-';
  const sp = ' '.repeat(level * 4);
  return {
    fisrtIndent: sp + mark + ' ',
    secondIndent: sp + '  ',
  };
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

