'use strict';

const LRU = require('lru-cache');
const frontMatter = require('front-matter');
const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const beautifier = require('./beautifier');
const a5conf = require('../conf');
const stringSimilarity = require('string-similarity');

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
function read(file) {
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
    doc.title = path.basename(doc.file, '.md');
  }
  if (doc.fm.attributes.category) {
    doc.category = doc.fm.attributes.category;
  } else {
    doc.category = dirnameToCategory(file);
  }
  if (!Array.isArray(doc.category)) {
    doc.category = [doc.category];
  }
  if (doc.fm.attributes.description) {
    doc.description = doc.fm.attributes.description;
  }
  cache.set(file, doc);
  return doc;
}
module.exports.read = read;

function write(doc) {
  // MDを整形する
  doc.content = beautifier.formatMd(doc.content);
  // MDを出力する
  fs.writeFileSync(doc.file, doc.content);
  cache.del(doc.file);
  return doc;
}
module.exports.write = write;

function lex(doc) {
  if (!doc._tokens) {
    const lexer = new marked.Lexer({
      gfm: true,
    });
    doc._tokens = lexer.lex(doc.fm.body);
  }
  return doc._tokens;
}

/**
 * 文書内の見出しを抽出する
 */
function headings(doc) {
  const tokens = lex(doc);
  return tokens.filter(token => token.type === 'heading');
}
module.exports.headings = headings;

/**
 * 文書内の見出しのスラッグを抽出する
 */
function slugsAll(doc) {
  if (!doc._slugs) {
    doc._slugs = module.exports.headings(doc).map(heading => {
      const slugger = new marked.Slugger();
      return slugger.slug(heading.text);
    });
  }
  return doc._slugs;
}
module.exports.slugs = slugsAll;

/**
 * 文書内のリンクを抽出する
 */
function links(doc) {
  if (!doc._links) {
    const renderer = new marked.Renderer({
      gfm: true,
    });
    doc._links = [];
    renderer.link = 
    renderer.image = function(href, title, text) {
      doc._links.push({
        href: href,
        title: title,
        text: text,
      });
      return text;
    };
    renderer.codespan = function(text) {
      return '`' + text + '`';
    };
    renderer.em = function(text) {
      return '*' + text + '*';
    };
    renderer.strong = function(text) {
      return '**' + text + '**';
    };
    renderer.del = function(text) {
      return '~~' + text + '~~';
    };
    renderer.html = function(text) {
      return text;
    };
    marked(doc.fm.body, {renderer: renderer});
  }
  return doc._links;
}
module.exports.links = links;

const _escapeReplacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function fixSlug(doc, link, slug) {
  let text = link.text;
  Object.keys(_escapeReplacements).forEach(ch => {
    const repl = _escapeReplacements[ch];
    let prevText;
    do {
      prevText = text;
      text = text.replace(repl, ch);
    } while (prevText != text);
    return text;
  });
  let oldLink = `[${text}](${link.href})`;
  const newLink = `[${text}](${slug})`;
  if (doc.content.indexOf(oldLink) >= 0) {
    doc.content = doc.content.replace(oldLink, newLink);
    return;
  }
  oldLink = oldLink.replace(/```/g, '~~~');
  if (doc.content.indexOf(oldLink) >= 0) {
    doc.content = doc.content.replace(oldLink, newLink);
    return;
  }
  oldLink = oldLink.replace(/\*/g, '_');
  if (doc.content.indexOf(oldLink) >= 0) {
    doc.content = doc.content.replace(oldLink, newLink);
    return;
  }

}
module.exports.fixSlug = fixSlug;

function matchSlug(doc, linkSlug) {
  const slugs = slugsAll(doc);
  const match = slugs.filter(slug => {
    return slug === linkSlug;
  });
  if (!match || match.length === 0) {
    return false;
  }
  return true;
}
module.exports.matchSlug = matchSlug;

function findSlugSimilarity(doc, srcLinkSlug) {
  const slugger = new marked.Slugger();
  const slugs = slugsAll(doc);
  const linkSlug = slugger.slug(srcLinkSlug);
  const matches = stringSimilarity.findBestMatch(linkSlug, slugs);
  if (matches.bestMatch.rating > 0.5) {
    return matches.bestMatch.target;
  }
console.dir(matches);
  return null;
}
module.exports.findSlugSimilarity = findSlugSimilarity;

function dirnameToCategory(file) {
  const conf = a5conf.get();
  const relative = path.relative(conf.docroot, file);
  const relativeDir = path.dirname(relative);
  return relativeDir.split(/[\\\/]/)
    .filter(dir => {
      return dir !== '.';
    });
}

function relativeLink(currDocFile, linkDocFile) {
  const currDir = path.dirname(currDocFile);
  const relative = path.relative(currDir, linkDocFile)
    .replace(/\\/g, '/');
  return relative;
}
module.exports.relativeLink = relativeLink;
