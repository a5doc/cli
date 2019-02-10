'use strict';

const _ = require('lodash');
const AppError = require('../errors');
const beautifier = require('./beautifier');

module.exports = CustomTag;

/**
 * タグのブロックを編集するクラス
 * 
 * 既に存在する文書ファイルを安全に編集できるように、
 * 文書中に編集可能なブロックを独自タグでマーキングしてあることを
 * 前提としている。
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
  // 属性(parseしたあと設定される)
  this.attributes = {};
  // タグ検索に使われるRegExp
  this.tagRegex = null;
  this.tagMatches = null;
}

/**
 * タグブロックがあるか確認する。
 * 
 * @param text ソースコード全体のテキスト
 */
CustomTag.prototype.find = function(text) {
  this.tagMatches = matchTagName(text, this);
  return (this.tagMatches !== null);
};

/**
 * タグブロックを置換する。
 * 
 * 処理内容は、appendとほぼ同じだが、最後に追記するのではなくて、
 * テキストを置き換える。
 * 
 * @param text ソースコード全体のテキスト
 * @param matchKeyword 検索キーワード
 * @param replacement 追加テキスト
 */
CustomTag.prototype.replace = function(text, replacement) {
  if (this.tagMatches === null) {
    // logger.error(text);
    throw new AppError(`<${this.tagName}>のタグが見つかりません`);
  }
  const m = this.tagMatches;
  replacement = `${m.replaceLeft}${replacement}${m.replaceRight}`
  return `${m.leftContext}${replacement}${m.rightContext}`;
};

/**
 * タグブロック内のテキストを抜き出す。
 * 
 * @param text ソースコード全体のテキスト
 */
CustomTag.prototype.extract = function(text) {
  if (this.tagMatches === null) {
    // logger.error(text);
    throw new AppError(`<${this.tagName}>のタグが見つかりません`);
  }
  return this.tagMatches.innerContent;
};

/**
 * タグブロック内にあるJSONをマージして置換する。
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
  if (this.tagMatches === null) {
    throw new AppError(`<${this.tagName}>のタグが見つかりません`);
  }
  const jsonTextMatches = matchJson(this.tagMatches.innerContent);
  let mergedJson = addJson;
  if (jsonTextMatches !== null) {
    const tsJson = parseTsJson(jsonTextMatches.innerContent);
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
  replaced = replaceJson(this.tagMatches._matches[0], replaced);

  return `${result.leftContext}${replaced}${result.rightContext}`;
}
  
function searchKeyword(text, keyword) {
  const regex = new RegExp(keyword, 'm');
  const matches = regex.exec(text);
  return matches !== null;
}

function matchTagName(text, customTag) {
  const tag = customTag.tagName;
  if (customTag.tagRegex === null) {
    customTag.tagRegex = new RegExp(`<${tag}([\\s\\S]*?)>([\\s\\S]*?)</${tag}>`, 'mg');
  }
  const matches = execRegex(text, customTag.tagRegex);
  if (matches === null) {
    return null;
  }
  customTag.attributes = parseAttr(matches._matches[1]);
  matches.innerContent = matches._matches[2];
  matches.replaceLeft = `<${tag}${matches._matches[1]}>`;
  matches.replaceRight = `</${tag}>`;
  return matches;
}

function parseAttr(attrStr) {
  const attributes = {};
  let attr = attrStr;
  const reAttr = /([a-z]+)="(.*?)"/;
  while (true) {
    const matches = execRegex(attr, reAttr);
    if (matches === null) {
      break;
    }
    const _name = matches._matches[1];
    const _val = matches._matches[2];
    attributes[_name] = _val;
    attr = matches.rightContext;
  }
  return attributes;
}

function execRegex(text, regex) {
  const matches = regex.exec(text);
  if (matches === null) {
    return null;
  }
  return {
    leftContext: text.substr(0, matches.index),
    _matches: matches,
    rightContext : text.substr(matches.index+matches[0].length),
  };
}

