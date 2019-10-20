'use strict';

const LRU = require('lru-cache');
const frontMatter = require('front-matter');
const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const beautifier = require('./beautifier');
const a5conf = require('../conf');

const cache = new LRU(50);

/**
 * MDを読み込んで mddoc 形式で返す
 * 
 * mddoc = {
 *  file: ファイルパス,
 *  content: ファイルの内容,
 *  fm: front-matter,
 *  title: タイトル（※1）
 *  category: カテゴリー（※2）
 *  description: 概要（※3）
 * }
 * 
 * ※1
 * FMにプロパティがあればそれをセットして、無ければファイル名がセットされる。
 * ※2
 * FMにプロパティがあればそれをセットして、
 * 無ければ a5conf.docroot 以下のディレクトリ名から作成される。
 * ※3
 * FMにプロパティがあればそれをセットして、無ければ undefined
 * 
 * @param {string} file ファイルパス
 * @returns mddoc形式
 */
module.exports.read = function(file) {
  let doc = cache.get(file);
  if (doc) {
    return doc;
  }
  doc = {};
  doc.file = file;
  doc.content = fs.readFileSync(file, 'utf8');
  doc.fm = frontMatter(doc.content);
  if (doc.fm.attributes.title) {
    doc.title = doc.fm.attributes.title;
  } else {
    doc.title = path.basename(doc.file);
  }
  if (doc.fm.attributes.category) {
    doc.category = doc.fm.attributes.category;
  } else {
    doc.category = dirnameToCategory(file);
  }
  if (doc.fm.attributes.description) {
    doc.description = doc.fm.attributes.description;
  }
  cache.set(file, doc);
  return doc;
}

module.exports.write = function(doc) {
  // MDを整形する
  doc.content = beautifier.formatMd(doc.content);
  // MDを出力する
  fs.writeFileSync(doc.file, doc.content);
  cache.del(doc.file);
  return doc;
}

/**
 * 文書内の見出しを抽出する
 */
module.exports.tokenizeHeading = function(doc) {
  const lexer = new marked.Lexer({
    gfm: true,
  });
  const tokens = lexer.lex(doc.fm.body);
  return tokens.filter(token => token.type === 'heading');
}

function dirnameToCategory(file) {
  const conf = a5conf.get();
  const relative = path.relative(conf.docroot, file);
  const relativeDir = path.dirname(relative);
  return relativeDir.split(/[\\\/]/)
    .filter(dir => {
      return dir !== '.';
    });
}
