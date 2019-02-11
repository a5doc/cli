'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const a5conf = require('./conf');
const a5util = require('./util');
const mdUtil = require('./util/mdUtil');
const CustomTag = require('./util/CustomTag');
const beautifier = require('./util/beautifier');
const frontMatter = require('front-matter');
const marked = require('marked');
const dirnameIndexer = require('./indexer/dirnameIndexer');

const _customTagFormatters = [
  {tagName:'toc', tag: new CustomTag('toc'), format: tocFormat},
];

/**
 * カスタムタグの処理を行う。
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
    // MDを整形する
    doc = beautifier.formatMd(doc);
    // MDを出力する
    fs.writeFileSync(docFile, doc);
  });
}
module.exports.writeAll = writeAll;

function getCustomTagFormatters(tagName) {
  if (!tagName) {
    return _customTagFormatters;
  }
  return _customTagFormatters.filter(formatter => formatter.tagName === tagName);
}

/**
 * tocタグ内の目次を更新する。
 * 
 * tocタグにsrc属性があった場合は、dirnameIndexerでファイルを
 * 検索して、目次を作成する。
 * src属性がない場合は、自身のmd内の見出しで目次を作成する。
 */
function tocFormat(formatter, doc, docFile) {
  // 自身のmd内の見出しも、外部ファイルを検索した結果も、
  // 以下の形式で作成して、同じ仕組みで目次を作成する。
  // tokenized = {
  //   docAttributes: {    // front-matterの内容
  //     title: 'XXXX',
  //   },
  //   headingTokens: [{
  //     depth: 2,         // 見出しの階層レベル
  //     text: '見出し2',  // 見出し名
  //     link: 'hoge.md'   // ファイル名（外部ファイルの場合のみ）
  //   },
  //   ],
  // };
  const attributes = _.merge({
    src: false,
    depth: Number.MAX_SAFE_INTEGER,
    level: Number.MAX_SAFE_INTEGER,
  }, formatter.tag.attributes);
  let tokenized;
  if (attributes.src) {
    tokenized = tokenizeExternalToc(doc, docFile, attributes.src);

  } else {
    tokenized = tokenizeInternalToc(doc, docFile);
  }
  const headingTokens = tokenized.headingTokens;
  // headingTokensの見出しリストから目次を作成する
  const minDepth = Math.min.apply(Math, headingTokens.map((token) => token.depth));
  const headings = headingTokens
    .map((token) => {
      if (token.depth > attributes.depth) {
        return null;
      }
      const level = token.depth - minDepth;
      if (level > attributes.level) {
        return null;
      }
      const indent = '    '.repeat(level);
      let link;
      // linkがある＝外部ファイルの検索結果でlinkをそのまま設定して
      // 内部のリンクの場合は、#をつけてtextを設定する。
      // mdでは見出しがそのままanchorになっている
      if (token.link) {
        link = mdUtil.mdLink(token.text, token.link);
      } else {
        link = mdUtil.mdLink(token.text, '#'+mdUtil.mdFileName(token.text));
      }
      return `${indent}- ${link}\n`;
    })
    .filter((heading) => heading != null);
  const blank = ['\n'];
  const tocInners = [].concat(blank, blank, headings, blank);
  // 作成した目次でタグ内を置き換える
  doc = formatter.tag.replace(doc, tocInners.join(''));
  return doc;
}

/**
 * 自身のmd内の見出しを抽出する
 * は、markedのLexerを使ってparseしている。
 */
function tokenizeInternalToc(doc, docFile) {
  const fm = frontMatter(doc);
  const lexer = new marked.Lexer({
    gfm: true,
  });
  const tokens = lexer.lex(fm.body);
  const headingTokens = tokens.filter(token => token.type === 'heading');
  const docAttributes = _.merge({
    title: path.basename(docFile),
  }, fm.attributes);
  return {
    docAttributes: docAttributes,
    headingTokens: headingTokens,
  };
}

function tokenizeExternalToc(doc, tocFile, src) {
  const fm = frontMatter(doc);
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
    walkChapter(tokens, chapter, 1, tocFile);
  });
  const docAttributes = _.merge({
    title: path.basename(tocFile),
  }, fm.attributes);
  return {
    docAttributes: docAttributes,
    headingTokens: tokens,
  };
}

function walkChapter(tokens, chapter, depth, tocFile) {
  if (!_.isEmpty(chapter.contents)) {
    const conf = a5conf.get();
    chapter.contents.forEach((content) => {
      const linkPath = path.join(conf.docroot, content.link);
      parseChapterContent(tokens, depth, linkPath, tocFile);
    });
    depth++;
  }
  if (chapter.chapters) {
    chapter.chapters.forEach((subchapter) => {
      walkChapter(tokens, subchapter, depth, tocFile);
    });
  }
  return tokens;
}

function parseChapterContent(tokens, parentDepth, linkPath, tocFile) {
  const tocDir = path.dirname(tocFile);
  const relative = path.relative(tocDir, linkPath)
    .replace(/\\/g, '/');
  const docFile = linkPath.match(/\.md$/) ? linkPath: `${linkPath}.md`;
  const innerDoc = fs.readFileSync(docFile, 'utf8');
  const innerDocTokenized = tokenizeInternalToc(innerDoc, linkPath);
  tokens.push({
    depth: parentDepth,
    text: innerDocTokenized.docAttributes.title,
    link: relative,
  });
  const innerDocTokens = innerDocTokenized.headingTokens;
  const minDepth = Math.min.apply(Math, innerDocTokens.map((token) => token.depth));
  innerDocTokens.forEach((token) => {
    const level = token.depth - minDepth;
    const hash = mdUtil.mdFileName(token.text);
    tokens.push({
      depth: parentDepth + level + 1,
      text: token.text,
      link: `${relative}#${hash}`,
    });
  });
}