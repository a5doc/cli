'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const a5conf = require('./conf');
const a5util = require('./util');
const mdUtil = require('./util/mdUtil');
const mdDoc = require('./util/mdDoc');
const CustomTag = require('./util/CustomTag');
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
    let doc = mdDoc.read(docFile);
    let modified = false;
    tagFormatters.forEach(formatter => {
      while (formatter.tag.find(doc.content)) {
        doc = formatter.format(formatter, doc);
        modified = true;
      }
    });
    if (!modified) {
      return;
    }
    mdDoc.write(doc);
  });
}
module.exports.writeAll = writeAll;

function getCustomTagFormatters(tagName) {
  if (!tagName) {
    return _customTagFormatters;
  }
  return _customTagFormatters.filter(formatter => formatter.tagName === tagName);
}

let _options = {};

/**
 * tocタグ内の目次を更新する。
 * 
 * tocタグにsrc属性があった場合は、dirnameIndexerでファイルを
 * 検索して、目次を作成する。
 * src属性がない場合は、自身のmd内の見出しで目次を作成する。
 */
function tocFormat(formatter, doc) {
  _options = parseOptions(formatter.tag.attributes);
  // 自身のmd内の見出しも、外部ファイルを検索した結果も、
  // 以下の形式で作成して、同じ仕組みで目次を作成する。
  // tokenized = {
  //   headingTokens: [{
  //     depth: 2,         // 見出しの階層レベル
  //     text: '見出し2',  // 見出し名
  //     link: 'hoge.md'   // ファイル名（外部ファイルの場合のみ）
  //   },
  //   ],
  // };
  let tokenized;
  if (_options.src) {
    tokenized = tokenizeExternalToc(doc);
  } else {
    tokenized = tokenizeInternalToc(doc);
  }
  const headingTokens = tokenized.headingTokens;
  // headingTokensの見出しリストから目次を作成する
  const minDepth = Math.min.apply(Math, headingTokens.map((token) => token.depth));
  const headings = headingTokens
    .map((token) => {
      if (token.depth > _options.depth) {
        return null;
      }
      const level = token.depth - minDepth;
      if (level > _options.level) {
        return null;
      }
      const indent = '    '.repeat(level);
      let link;
      // linkがある＝外部ファイルの検索結果でlinkをそのまま設定して
      // 内部のリンクの場合は、#をつけてtextを設定する。
      // mdでは見出しがそのままanchorになっている
      if (token.link === null) {
        link = token.text;
      } else if (token.link) {
        link = mdUtil.mdLink(token.text, token.link);
      } else {
        link = mdUtil.mdLink(token.text, '#'+mdUtil.mdFileName(token.text));
      }
      const line = `${indent}- ${link}  \n`;
      if (_options.desc && token.desc) {
        return `${line}${indent}    ${token.desc}\n`;
      } else {
        return line;
      }
    })
    .filter((heading) => heading != null);
  const blank = ['\n'];
  const tocInners = [].concat(blank, blank, headings, blank);
  // 作成した目次でタグ内を置き換える
  doc.content = formatter.tag.replace(doc.content, tocInners.join(''));
  return doc;
}

function parseOptions(attributes) {
  const options = _.merge({
    src: false,
    desc: 'true',
    category: 'true',
    depth: Number.MAX_SAFE_INTEGER,
    level: Number.MAX_SAFE_INTEGER,
  }, attributes);
  options.desc = options.desc == 'true';
  options.category = options.category == 'true';
  return options;
}

function splitSrcOption(src, doc) {
  src = src.split('|');
  src = src.map(s => {
    let not = '';
    if (s.match(/^\!/)) {
      s = s.substr(1);
      not = '!';
    }
    if (s.match(/^\//)) {
      s = s.substr(1);
    } else {
      const conf = a5conf.get();
      const currDir = path.dirname(doc.file);
      const relativeDir = path.relative(conf.docroot, currDir);
      s = path.join(relativeDir, s);
    }
    return not + s;
  });
  return src;
}

/**
 * 自身のmd内の見出しを抽出する
 * は、markedのLexerを使ってparseしている。
 */
function tokenizeInternalToc(doc) {
  return {
    headingTokens: mdDoc.tokenizeHeading(doc),
  };
}

let _currCategory = [];

function tokenizeExternalToc(doc) {
  _currCategory = [];
  const src = splitSrcOption(_options.src, doc);
  const chapters = dirnameIndexer.findAndCreateChapters({src: src});
  const tokens = [];
  chapters.forEach((chapter) => {
    walkChapter(tokens, chapter, 1, doc);
  });
  return {
    headingTokens: tokens,
  };
}

function walkChapter(tokens, chapter, depth, originDoc) {
  if (!_.isEmpty(chapter.contents)) {
    const conf = a5conf.get();
    chapter.contents.forEach((content) => {
      const linkPath = path.join(conf.docroot, content.link);
      parseChapterContent(tokens, depth, linkPath, originDoc);
    });
    depth++;
  }
  if (chapter.chapters) {
    chapter.chapters.forEach((subchapter) => {
      walkChapter(tokens, subchapter, depth, originDoc);
    });
  }
  return tokens;
}

function parseChapterContent(tokens, parentDepth, linkPath, originDoc) {
  const originDir = path.dirname(originDoc.file);
  const relative = path.relative(originDir, linkPath)
    .replace(/\\/g, '/');
  const linkFile = linkPath.match(/\.md$/) ? linkPath: `${linkPath}.md`;
  const linkDoc = mdDoc.read(linkFile);
  // カテゴリを見出しとして追加
  if (_options.category) {
    const relativeCat = [];
    for (let i=0, eq=true; i < linkDoc.category.length; i++) {
      if (eq && 
          originDoc.category.length > i &&
          linkDoc.category[i] == originDoc.category[i]) {
        continue;
      }
      eq = false;
      relativeCat.push(linkDoc.category[i]);
    }
    for (let i=0, eq=true; i < relativeCat.length; i++, parentDepth++) {
      if (eq && 
          _currCategory.length > i &&
          relativeCat[i] == _currCategory[i]) {
        continue;
      }
      eq = false;
      const token = {
        depth: parentDepth,
        text: relativeCat[i],
        link: null,
      };
      tokens.push(token);
    }
    _currCategory = relativeCat;
  }
  // linkDoc自身を見出しとして追加
  const selfToken = {
    depth: parentDepth,
    text: linkDoc.title,
    link: relative,
  };
  if (linkDoc.description) {
    selfToken.desc = linkDoc.description;
  }
  tokens.push(selfToken);
  // linkDoc内の見出しをdepthを+1したサブ見出しとして追加
  const linkDocTokenized = tokenizeInternalToc(linkDoc, linkPath);
  const linkDocTokens = linkDocTokenized.headingTokens;
  const minDepth = Math.min.apply(Math, linkDocTokens.map((token) => token.depth));
  linkDocTokens.forEach((token) => {
    const level = token.depth - minDepth;
    const hash = mdUtil.mdFileName(token.text);
    tokens.push({
      depth: parentDepth + level + 1,
      text: token.text,
      link: `${relative}#${hash}`,
    });
  });
}