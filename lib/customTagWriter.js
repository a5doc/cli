'use strict';

const fs = require('fs-extra');
const path = require('path');
const a5conf = require('./conf');
const a5util = require('./util');
const mdUtil = require('./util/mdUtil');
const CustomTag = require('./util/CustomTag');
const beautifier = require('./util/beautifier');
const frontMatter = require('front-matter');
const marked = require('marked');
const dirnameIndexer = require('./indexer/dirnameIndexer');

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
    console.log(`tag ${tagName} ${docFile} ...`);
    let doc = fs.readFileSync(docFile, 'utf8');
    let modified = false;
    tagFormatters.forEach(formatter => {
      while (formatter.tag.find(doc)) {
        doc = formatter.format(formatter, doc, docFile);
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

function tocFormat(formatter, doc, docFile) {
  let headingTokens;
  if (formatter.tag.attributes.src) {
    headingTokens = tokenizeExternalToc(formatter.tag.attributes.src, docFile);
  } else {
    headingTokens = tokenizeInternalToc(doc);
  }
  const minDepth = Math.min.apply(Math, headingTokens.map((token) => token.depth));
  const headings = headingTokens.map((token) => {
    const depth = token.depth - minDepth;
    const mark = depth === 0 ? '*': '-';
    const indent = '    '.repeat(depth);
    let link;
    if (token.link) {
      link = mdUtil.mdLink(token.text, token.link);
    } else {
      link = mdUtil.mdLink(token.text, '#'+mdUtil.mdFileName(token.text));
    }
    return `${indent}${mark} ${link}\n`;
  });
  const blank = ['\n'];
  const tocInners = [].concat(blank, blank, headings, blank);
  doc = formatter.tag.replace(doc, tocInners.join(''));
  return doc;
}

function tokenizeInternalToc(doc) {
  const content = frontMatter(doc);
  const lexer = new marked.Lexer({
    gfm: true,
  });
  const tokens = lexer.lex(content.body);
  const headingTokens = tokens.filter(token => token.type === 'heading');
  return headingTokens;
}

function tokenizeExternalToc(src, tocFile) {
  if (src.match(/^\//)) {
    src = src.substr(1);
  } else {
    const conf = a5conf.get();
    const currDir = path.dirname(tocFile);
    const relativeDir = path.relative(conf.docroot, currDir);
    src = path.join(relativeDir, src);
  }
  const chapters = dirnameIndexer.findAndCreateChapters({src: src});
  const tokens = [];
  chapters.forEach((chapter) => {
    walkChapter(tokens, chapter, 0, tocFile);
  });
  return tokens;
}

function walkChapter(tokens, chapter, depth, tocFile) {
  if (chapter.contents) {
    const conf = a5conf.get();
    chapter.contents.forEach((content) => {
      const linkPath = path.join(conf.docroot, content.link);
      const tocDir = path.dirname(tocFile);
      const relative = path.relative(tocDir, linkPath)
        .replace(/\\/g, '/');
      tokens.push({
        depth: depth,
        text: content.title,
        link: relative,
      });
    });
  }
  if (chapter.chapters) {
    depth++;
    chapter.chapters.forEach((subchapter) => {
      walkChapter(tokens, subchapter, depth+1, tocFile);
    });
  }
  return tokens;
}
