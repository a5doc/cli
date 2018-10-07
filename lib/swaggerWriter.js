'use strict';

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const _ = require('lodash');
const childProcess = require('child_process');
const a5conf = require('./conf');
const a5util = require('./util');
const AppError = require('./errors');

/**
 * swagger specのymlからmdを作成し、
 * 1つのswagger.ymlにマージして出力する。
 */
function writeAll() {
  const conf = a5conf.get();
  // common.ymlを読み込む
  const common = readCommon(conf);
  // 対象のファイルを検索
  const docFiles = a5util.findFilesGlob(conf.swagger.src, {
    rootDir: conf.docroot
  });
  // 本来commonは最後にマージするのだが、プロパティの出現位置を
  // common.ymlの状態を正にしたいので、最初にマージしておく。
  let mergeDoc = _.merge({}, common);
  docFiles.forEach(docFile => {
    // MDを出力する
    writeMd(docFile, common);
    const doc = yaml.safeLoad(fs.readFileSync(docFile, 'utf8'))
    // 1つのobjectにマージする
    mergeDoc = _.merge(mergeDoc, doc);
  });
  mergeDoc = mergeCommon(mergeDoc, common);
  // URLとリクエストメソッドのプロパティを並べ替える
  sortPaths(mergeDoc);
  // マージしたobjectを出力する
  writeMeregedSwagger(conf, mergeDoc);
}
module.exports.writeAll = writeAll;

/**
 * swagger specの共通定義部分(common.yml)を読み込む。
 * common.ymlの中のpathsはダミーの定義なので削除する。
 * ただし、pathsのプロパティの出現位置は、残しておきたいので、
 * pathとしてあり得ない ? をダミーとして入れておく。
 * このダミーはmergeCommonの中でマージ後に削除する。
 * @param {object} conf a5docコンフィグ
 */
function readCommon(conf) {
  if (_.isNil(conf.swagger.common)) {
    return {};
  }
  const file = path.join(conf.docroot, conf.swagger.common);
  const common = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(common.paths);
  common.paths['?'] = 'a';
  keys.forEach(key => {delete common.paths[key]});
  return common;
}

/**
 * 共通定義部分(common.yml)をマージする
 * @param {object} doc swagger spec
 * @param {object} common 共通定義部分(common.yml)
 */
function mergeCommon(doc, common) {
  doc = _.merge(doc, common);
  delete doc.paths['?'];
  return doc;
}

/**
 * swagger specのファイルからマークダウンに出力。
 * 対象のファイルに共通定義部分のspecをマージして、
 * tmpファイルを出力したものを、mdに変換する。
 * 変換には、 swagger-markdown を使う。
 * @param {object} srcfile swagger specのファイル
 * @param {object} common swagger specの共通定義部分
 */
function writeMd(srcfile, common) {
  const srcpath = path.parse(srcfile);
  const tmp = path.format({
    dir: srcpath.dir,
    name: srcpath.name,
    ext: '.yml.tmp'
  });
  const dst = path.format({
    dir: srcpath.dir,
    name: srcpath.name,
    ext: '.md'
  });
  let content = yaml.safeLoad(fs.readFileSync(srcfile, 'utf8'));
  content = mergeCommon(content, common);
  content = yaml.safeDump(content);
  fs.writeFileSync(tmp, content);
  const result = childProcess.execSync(
    'swagger-markdown -i ' + tmp +' -o ' + dst
  );
  if (!_.isEmpty(result)) {
    throw new AppError(
      'swagger-markdownの実行でエラーが発生\n'
      + result.toString()
    );
  }
  fs.removeSync(tmp);
}

/**
 * マージしたswagger specを出力する。
 * 出力ファイルの拡張子で、jsonとymlの2種類を区別する。
 * @param {object} conf a5docコンフィグ
 * @param {*} doc マージしたswagger spec
 */
function writeMeregedSwagger(conf, doc) {
  // マージしたobjectを出力する
  if (_.isEmpty(conf.swagger.merge)) {
    return;
  }
  const mergePaths = Array.isArray(conf.swagger.merge) ? conf.swagger.merge: [conf.swagger.merge];
  mergePaths.forEach(mergePath => {
    const ext = path.extname(mergePath);
    let content;
    if (ext === '.json') {
      content = JSON.stringify(doc, null, 2);
    } else if (ext === '.yml' || ext === '.yaml') {
      content = yaml.safeDump(doc);
    } else {
      throw new AppError('不明な拡張子です:' + mergePath);
    }
    const file = path.join(conf.docroot, mergePath);
    fs.writeFileSync(file, content);
  });
}

/**
 * swagger specのobjectのプロパティを並べ替える。
 * objectをマージするとプロパティの並び順がマージした順番になるので、
 * 以下の2つのプロパティをソートする。
 * - pathsのURL
 * - リクエストメソッド
 * @param {*} doc マージされたswagger specのobject
 */
function sortPaths(doc) {
  doc.paths = Object.keys(doc.paths)
    .sort()
    .reduce((paths, url) => {
      paths[url] = doc.paths[url];
      paths[url] = Object.keys(paths[url])
        .sort((p1, p2) => {
          const order = {
            get: 1,
            post: 2,
            put: 3,
            delete: 4,
          };
          p1 = _.isNil(order[p1]) ? 0: order[p1];
          p2 = _.isNil(order[p2]) ? 0: order[p2];
          return p1 - p2;
        })
        .reduce((properties, property) => {
          properties[property] = paths[url][property];
          return properties;
        }, {});
      return paths;
    }, {});
}