'use strict';

const _ = require('lodash');
const AppError = require('../errors');
const beautifier = require('./beautifier');

module.exports = CustomTag;

/**
 * マーカーのブロックを編集するクラス
 * 
 * 既に存在する文書ファイルを安全に編集できるように、
 * 文書中に編集可能なブロックをコメント行としてマーキングしてある。
 * ```
 * <a5doc-xxxxx>
 * ・・・・
 * </a5doc-xxxxx>
 * ```
 * このクラスでは、マーキングされた部位を特定して置換する。
 */
function CustomTag(tagName) {
  // タグ名
  this.tagName = tagName;
}

/**
 * マーカーブロックがあるか確認する。
 * 
 * @param text ソースコード全体のテキスト
 */
CustomTag.prototype.find = function(text) {
  const result = matchTagName(text, this);
  return (result !== null);
};

/**
 * マーカーブロックに追記する。
 * 
 * ソースコード全体から、マーカーブロックを正規表現で特定して、
 * 次に、そのブロック内に、matchKeywordのキーワードが既にある場合は、
 * 何も置換しないで、オリジナルのtextを返す。
 * キーワードが存在しない場合には、ブロックの終端に、appendTextを追加する。
 * 
 * @param text ソースコード全体のテキスト
 * @param matchKeyword 検索キーワード
 * @param appendText 追加テキスト
 */
CustomTag.prototype.append = function(text, matchKeyword, appendText) {
  const result = matchTagName(text, this);
  if (result === null) {
    // logger.error(text);
    throw new AppError(`<${this.tagName}>のマーカーが見つかりません`);
  }
  if (searchKeyword(result.matches[1], matchKeyword)) {
    // logger.debug(`exists ${matchKeyword}`);
    return text;
  }
  // logger.debug(`append ${matchKeyword}`);
    
  const indent = result.endTagLine.match(/([ \t]*)/);
  return `${result.startTagLine}${result.contentLines}${indent[1]}${appendText}\n${result.endTagLine}`;
};

/**
 * マーカーブロックを置換する。
 * 
 * 処理内容は、appendとほぼ同じだが、最後に追記するのではなくて、
 * テキストを置き換える。
 * 
 * @param text ソースコード全体のテキスト
 * @param matchKeyword 検索キーワード
 * @param replacement 追加テキスト
 */
CustomTag.prototype.replace = function(text, matchKeyword, replacement) {
  const result = matchTagName(text, this);
  if (result === null) {
    // logger.error(text);
    throw new AppError(`<${this.tagName}>のマーカーが見つかりません`);
  }
  if (matchKeyword != null) {
    if (this.searchKeyword(result.matches[1], matchKeyword)) {
      // logger.debug(`exists ${matchKeyword}`);
      return text;
    }
    // logger.debug(`append ${matchKeyword}`);
  }
  return `${result.startTagLine}${replacement}${result.endTagLine}`;
};

/**
 * マーカーブロック内のテキストを抜き出す。
 * 
 * @param text ソースコード全体のテキスト
 */
CustomTag.prototype.extract = function(text) {
  const result = matchTagName(text, this);
  if (result === null) {
    // logger.error(text);
    throw new AppError(`<${this.tagName}>のマーカーが見つかりません`);
  }
  return result.contentLines;
};

/**
 * マーカーブロック内にあるJSONをマージして置換する。
 * 
 * tsのコードで記述されたanyオブジェクト（JSON的定義）のブロックを置換する。
 * tsのコードなので、そのままでは JSON.parse できないので、
 * 補正してbeautifierで整形して、parse してから、オブジェクトをマージする。
 * 
 * マージは、既存の実装を上書きして消さないように、
 * addJsonに対して、tsのコードから読み取ったjsonを上書きする。
 * 
 * @param text ソースコード全体のテキスト
 * @param addJson マージするオブジェクト
 */
CustomTag.prototype.mergeTsJson = function(text, addJson) {
  const result = matchTagName(text, this);
  if (result === null) {
    throw new AppError(`<${this.tagName}>のマーカーが見つかりません`);
  }
  const jsonTextMatches = matchJson(result.matches[1]);
  let mergedJson = addJson;
  if (jsonTextMatches !== null) {
    const tsJson = parseTsJson(jsonTextMatches.matches[1]);
    // プロパティの順番が変わらないようにtsJsonにaddJsonをマージしたあと、
    // 既存の実装を上書きして消さないようaddJsonにtsJsonをマージしなおす
    mergedJson = _.merge(tsJson, addJson);
    mergedJson = _.merge(mergedJson, tsJson);
  }
  // TODO 指定された階層のプロパティだけにしたい
  // プロパティをソートする
  if (mergedJson.data !== undefined && mergedJson.data.FQC !== undefined) {
    const sorted = {};
    const keys = Object.keys(mergedJson.data.FQC).sort();
    keys.forEach((key) => {
      sorted[key] = mergedJson.data.FQC[key];
    });
    mergedJson.data.FQC = sorted;
  }
  let replaced = formatTsJson(mergedJson);
  
  // オリジナルのテキストの { ... } 部分を入れ替える
  replaced = replaceJson(result.matches[0], replaced);

  return `${result.leftContext}${replaced}${result.rightContext}`;
}
  
function searchKeyword(text, keyword) {
  const regex = new RegExp(keyword, 'm');
  const matches = regex.exec(text);
  return matches !== null;
}

function parseTsJson(text) {
  const jsonText = beautifier.formatJson(text);
  return JSON.parse(jsonText);
}

function formatTsJson(json) {
  let text = JSON.stringify(json, null, 2);
  text = text.replace(/"(.*)":/g, '$1:');
  text = `const a = ${text};`;
  text = beautifier.formatTs(text);
  text = text.replace(/^const a = /, '');
  text = text.replace(/;$/m, '');
  text = text.trim();
  return text;
}

function matchJson(text) {
  const regex = new RegExp('(\\{[\\s\\S]+\\})', 'm');
  return execRegex(text, regex);
}

function replaceJson(text, replacement) {
  const regex = new RegExp('(\\{[\\s\\S]+\\})', 'm');
  return text.replace(regex, replacement);
}

function matchTagName(text, customTag) {
  const regex = new RegExp(`<${customTag.tagName}>([\\s\\S]*?)</${customTag.tagName}>`, 'm');
  const matches = execRegex(text, regex);
  const startTagLine = new RegExp(`[\\s\\S]*?<${customTag.tagName}>.*[\\s]`, 'm').exec(text);
  if (startTagLine === null) {
    return null;
  }
  const endTagLine = new RegExp(`[\\n].*?</${customTag.tagName}>[\\s\\S]*`, 'm').exec(text);
  if (endTagLine === null) {
    throw new AppError(`</${customTag.tagName}>の終了行が見つかりません`);
  }
  return _.merge(matches, {
    startTagLine: text.substr(0, startTagLine[0].length),
    endTagLine: text.substr(endTagLine.index + 1),
    contentLines: text.substring(startTagLine[0].length, endTagLine.index + 1),
  });
}

function execRegex(text, regex) {
  const matches = regex.exec(text);
  if (matches === null) {
    return null;
  }
  return {
    leftContext: text.substr(0, matches.index),
    matches: matches,
    rightContext : text.substr(matches.index+matches[0].length),
  };
}

