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
  {tagName:'breadcrumb', tag: new CustomTag('breadcrumb'), format: breadcrumbFormat},
];

/**
 * カスタムタグの処理を行う。
 */
function writeAll(tagName) {
  const conf = a5conf.get();
  // 対象のファイルを検索
  const docFiles = a5util.findFilesGlob('**/*.md', {
    rootDir: conf.docroot
  });
  docFiles.forEach(docFile => {
    console.log(`tag ${tagName} ${docFile} ...`);
    write(tagName, docFile);
  });
}
module.exports.writeAll = writeAll;

/**
 * カスタムタグの処理を行う。
 */
function write(tagName, docFile) {
  const tagFormatters = getCustomTagFormatters(tagName);
  let doc = mdDoc.read(docFile);
  console.log(`tag ${tagName} ${docFile} ...`);
  let modified = false;
  tagFormatters.forEach(formatter => {
    let foundTag = formatter.tag.find(doc.content);
    while (foundTag) {
      const replaced = formatter.format(formatter, doc);
      modified = true;
      doc.content = formatter.tag.replace(replaced);
      foundTag = formatter.tag.next(doc.content);
    }
  });
  if (!modified) {
    return;
  }
  mdDoc.write(doc);
}
module.exports.write = write;

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
  _options = parseTocOptions(formatter.tag.attributes);
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
  // 作成した目次のmdテキスト
  return tocInners.join('');
}

/**
 * breadcrumb タグ内を更新する。
 * 
 * categoryでパンくずリストを作成する。
 * 先頭は、 Home として、wiki の場合は、home.md に、mdの場合は、README.md にリンクする。
 * 2つ目以降は、カテゴリーで出力する。
 * カテゴリへのリンクは、カテゴリに1つしか文書がない場合は、それを、複数の文書がある場合は、
 * 次の優先順で文書を選択して、リンクにする。
 */
function breadcrumbFormat(formatter, doc) {
  _options = parseBreadcrumbOptions(formatter.tag.attributes);
  initCategoryIndex();

  const texts = [];
  // パンくずの最初はHomeのリンク
  if (_categoryIndexMap['__home__']) {
    const homeDoc = mdDoc.read(_categoryIndexMap['__home__']);
    const homeLink = mdDoc.relativeLink(doc.file, homeDoc.file);
    texts.push(mdUtil.mdLink('Home', homeLink));
  }
  // カテゴリのパンくずを追加
  for (let i=0; i < doc.category.length; ++i) {
    const cats = [];
    for (let j=0; j <= i; ++j) {
      cats.push(doc.category[j]);
    }
    const catKey = JSON.stringify(cats);
    // もしもカテゴリの代表文書がなければリンクは付けない
    if (!_categoryIndexMap[catKey]) {
      texts.push(doc.category[i]);
      continue;
    }
    // カテゴリの代表文書があるときはリンクを付ける
    const catDocFile = _categoryIndexMap[catKey];
    const catLink = mdDoc.relativeLink(doc.file, catDocFile);
    texts.push(mdUtil.mdLink(doc.category[i], catLink));
  }
  // パンくずの最後は自身の文書名にしてリンクは付けない
  texts.push(doc.title);

  // 作成したパンくずリストでタグ内を置き換える
  doc.content = formatter.tag.replace(doc.content, texts.join(' \\> '));
  return doc;
}

let _categoryIndexMap = null;

/**
 * カテゴリへのリンクを作成する
 */
function initCategoryIndex() {
  if (_categoryIndexMap) {
    return;
  }
  _categoryIndexMap = {};
  const conf = a5conf.get();
  // 全ドキュメントのカテゴリのマップを作成する
  const docFiles = a5util.findFilesGlob('**/*.md', {
    rootDir: conf.docroot
  });
  const cats = {};
  docFiles.forEach(docFile => {
    const doc = mdDoc.read(docFile);
    const catKey = JSON.stringify(doc.category);
    if (!cats[catKey]) {
      cats[catKey] = {
        files: [],
      };
    }
    cats[catKey].files.push(docFile);
    const relative = path.relative(conf.docroot, docFile);
    if (conf.docstyle === 'wiki') {
      if (relative.match(/^home\.md$/i)) {
        _categoryIndexMap['__home__'] = docFile;
      }
    } else {
      if (relative.match(/^README\.md$/i)) {
        _categoryIndexMap['__home__'] = docFile;
      }
    }
  });
  // カテゴリの代表文書を決める
  const catKeys = Object.keys(cats);
  for (let i=0; i < catKeys.length; i++) {
    const key = catKeys[i];
    const cat = cats[key];
    for (let j=0; j < cat.files.length; j++) {
      const file = cat.files[j];
      const parsed = path.parse(file);
      if (parsed.base.match(/^(README|index)\.md$/)) {
        _categoryIndexMap[key] = file;
        break;
      }
      const doc = mdDoc.read(file);
      if (doc.title.match(/^(目次|インデックス)$/)) {
        _categoryIndexMap[key] = file;
        break;
      }
      const lastCat = doc.category[doc.category.length - 1];
      if (doc.title === lastCat) {
        _categoryIndexMap[key] = file;
        break;
      }
    }
  }
}

function parseTocOptions(attributes) {
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

function parseBreadcrumbOptions(attributes) {
  const options = _.merge({
  }, attributes);
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
    walkChapterForToc(tokens, chapter, 1, doc);
  });
  return {
    headingTokens: tokens,
  };
}

function walkChapterForToc(tokens, chapter, depth, originDoc) {
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
      walkChapterForToc(tokens, subchapter, depth, originDoc);
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