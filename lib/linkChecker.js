'use strict';

const fs = require('fs-extra');
const path = require('path');
const a5conf = require('./conf');
const a5util = require('./util');
const mdDoc = require('./util/mdDoc');
const marked = require('marked');

let _options = {
  autofix: false,
};

/**
 * リンク切れのチェックをする。
 */
function checkAll(options) {
  Object.assign(_options, options);
  const conf = a5conf.get();
  // 対象のファイルを検索
  const docFiles = a5util.findFilesGlob('**/*.md', {
    rootDir: conf.docroot
  });
  let result = true;
  docFiles.forEach(docFile => {
    console.log(`link-check ${docFile} ...`);
    if (!check(docFile)) {
      result = false;
    }
  });
  return result;
}
module.exports.checkAll = checkAll;

/**
 * リンク切れのチェックをする。
 */
function check(docFile, options) {
  Object.assign(_options, options);
  const conf = a5conf.get();
  const doc = mdDoc.read(docFile);
  const links = mdDoc.links(doc);
  let result = false;
  let modified = false;
  links.forEach(link => {
    if (!link.href) {
      return;
    }
    do {
      if (link.href.match(/^#/)) {
        // 文書内のリンク
        const linkSlug = link.href.replace(/#(.*)/, '$1');
        if (!mdDoc.matchSlug(doc, linkSlug)) {
          let slug = null;
          if (_options.fix) {
            slug = mdDoc.findSlugSimilarity(doc, linkSlug);
          }
          if (slug === null) {
            console.error(`[x] [${link.text}](${link.href})  ヘッダーがない a5doc slug ${docFile} でスラッグを確認してください`);
            break;
          }
          const newSlug = `#${slug}`;
          mdDoc.fixSlug(doc, link, newSlug);
          console.log(`[o] [${link.text}](${newSlug})  スラッグを置き換えました`);
          modified = true;
        }
      } else if (link.href.match(/^https?:\/\//)) {
        // WEBサイトはチェックしない
      } else {
        // 相対パス
        const linkFile = link.href.replace(/\/?#.*/, '');
        let toFile = path.join(path.dirname(docFile), linkFile);
        if (conf.docstyle === 'wiki') {
          if (fs.existsSync(toFile + '.md')) {
            toFile += '.md';
          } else {
            const ext = path.extname(toFile);
            if (ext === '.md' || ext === '') {
              toFile += '.md';
            }
          }
        }
        if (!fs.existsSync(toFile)) {
          console.error(`[x] [${link.text}](${link.href})  ファイルがない ${toFile}`);
          break;
        }
        const reSlug = /.+#(.*)/;
        if (link.href.match(reSlug)) {
          const linkSlug = link.href.replace(reSlug, '$1');
          const linkDoc = mdDoc.read(toFile);
          if (!mdDoc.matchSlug(linkDoc, linkSlug)) {
            let slug = null;
            if (_options.fix) {
              slug = mdDoc.findSlugSimilarity(linkDoc, linkSlug);
            }
            if (slug === null) {
              console.error(`[x] [${link.text}](${link.href})  ヘッダーがない a5doc slug ${toFile} でスラッグを確認してください`);
              break;
            }
            const newSlug = link.href.replace(/#.*/, `#${slug}`);
            mdDoc.fixSlug(doc, link, newSlug);
            console.log(`[o] [${link.text}](${newSlug})  スラッグを置き換えました`);
            modified = true;
          }
        }
        result = true;
        // console.log(`[o] [${link.text}](${link.href})`);
      }
    } while (false);
  });
  if (modified) {
    mdDoc.write(doc);
  }
  return result;
}
module.exports.check = check;

function slug(docFile) {
  const doc = mdDoc.read(docFile);
  const headings = mdDoc.headings(doc);
  console.log(`${docFile} \n[ヘッダーのテキスト] ---> (スラッグ)`)
  headings.forEach(heading => {
    const slugger = new marked.Slugger();
    console.log(`[${heading.text}] ---> (${slugger.slug(heading.text)})`);
  });
}
module.exports.slug = slug;
