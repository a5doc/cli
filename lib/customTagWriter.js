'use strict';

const fs = require('fs-extra');
const a5conf = require('./conf');
const a5util = require('./util');
const mdUtil = require('./util/mdUtil');
const CustomTag = require('./util/CustomTag');
const beautifier = require('./util/beautifier');
const frontMatter = require('front-matter');
const marked = require('marked');

/**
 * カスタムタグ内の目次を更新する。
 */
function writeAll(tagName) {
  const conf = a5conf.get();
  const tagFormatters = getCustomTagFormatters(tagName);
  // 対象のファイルを検索
  const docFiles = a5util.findFilesGlob('**/*.md', {
    rootDir: conf.docroot
  });
  docFiles.forEach(docFile => {
    console.log('tag ' + docFile + ' ...');
    let doc = fs.readFileSync(docFile, 'utf8');
    let modified = false;
    tagFormatters.forEach(formatter => {
      if (formatter.tag.find(doc)) {
        doc = formatter.format(formatter, doc);
        modified = true;
      }
    });
    if (!modified) {
      return;
    }
    doc = beautifier.formatMd(doc);
    // MDを出力する
    fs.writeFileSync(docFile, doc);
  });
}
module.exports.writeAll = writeAll;

const _customTagFormatters = [
  {tagName:'toc', tag: new CustomTag('toc'), format: tocFormat},
];

function getCustomTagFormatters(tagName) {
  if (!tagName) {
    return _customTagFormatters;
  }
  return _customTagFormatters.filter(formatter => formatter.tagName === tagName);
}

function tocFormat(formatter, doc) {
  const content = frontMatter(doc);
  const lexer = new marked.Lexer({
    gfm: true,
  });
  const tokens = lexer.lex(content.body);
  const headingTokens = tokens.filter(token => token.type === 'heading');
  const minDepth = Math.min.apply(Math, headingTokens.map((token) => token.depth));
  const headings = headingTokens.map((token) => {
    const depth = token.depth - minDepth;
    const mark = depth === 0 ? '*': '-';
    const indent = '    '.repeat(depth);
    const link = mdUtil.mdLink(token.text, '#'+mdUtil.mdFileName(token.text));
    return `${indent}${mark} ${link}\n`;
  });
  const blank = ['\n'];
  const tocInners = [].concat(blank, headings, blank);
  doc = formatter.tag.replace(doc, null, tocInners.join(''));
  return doc;
}
