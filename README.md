# a5doc

MD で仕様書を作成することをサポートするためのツールです。

Sphinx や GitBook など、テキストでドキュメントを管理するツールは、すでに、いくつもありますが、それらのツールは、MD ファイルをソースとして、html や pdf に変換してドキュメントを閲覧しますが、a5doc は`MDファイルを作成することをサポートする`ツールです。

作成された MD ファイルは、github や gitlab の wiki に、そのままコミットして、wiki で仕様書を参照すること、あるいはテキストエディタで仕様書を読むことを目的にしています。

a5doc は、WEB サーバー機能を持っているわけではなくて、単純に MD ファイルの補正と作成をするだけなので、Sphinx や GitBook などの実行になんら影響を与えません。  
普段は、wiki で仕様書を書いて、HTML で公開するとか PDF でドキュメントを納品するときに、その目的に適した Sphinx や GitBook を使うといった、併用が良いと思います。

<toc>

- [a5doc](#a5doc)
  - [はじめに](#はじめに)
    - [a5doc をグローバルにインストールする場合](#a5doc-をグローバルにインストールする場合)
    - [a5doc をローカルにインストールする場合](#a5doc-をローカルにインストールする場合)
  - [目次の作成](#目次の作成)
    - [dirnameIndexer](#dirnameIndexer)
    - [chapterIndexer](#chapterIndexer)
  - [テーブル定義の作成](#テーブル定義の作成)
  - [ER 図の作成](#ER-図の作成)
  - [Swagger.yml から API インターフェース仕様の MD を作成](#Swaggeryml-から-API-インターフェース仕様の-MD-を作成)
  - [PDF を出力](#PDF-を出力)
    - [PDF のレイアウト調整に関する補足](#PDF-のレイアウト調整に関する補足)
  - [文書内の TOC を更新](#文書内の-TOC-を更新)
    - [`<toc>`のオプション](#`<toc>`のオプション)
    - [外部文書を TOC として作成](#外部文書を-TOC-として作成)
  - [カテゴリーからパンくずリストを作成](#カテゴリーからパンくずリストを作成)
  - [リンク切れチェックと修正](#リンク切れチェックと修正)
  - [文書に Front-matter を付ける](#文書に-Front-matter-を付ける)

</toc>

次はこんなこともしたい・・・

- MD 仕様書から用語の抽出
- GLOSSARY の作成
- 用語のスペルチェック
- 章のナンバリング
- CRUD 表の作成

## はじめに

Node.js が使える状態を前提としています。

### a5doc をグローバルにインストールする場合

```bash
# インストール
npm install -g a5doc

# 初期設定
a5doc init
```

初期設定を実行すると、カレントディレクトリに、 `a5doc.yml` が作成されます。  
a5doc の設定は、このファイルで行います。

### a5doc をローカルにインストールする場合

a5doc のインストール

```bash
npm install --save a5doc
```

package.json に script を追加

```json
{
  ・・・
  "scripts": {
    "a5doc": "a5doc"
  },
  ・・・
}
```

初期設定を実行

```bash
npm run a5doc init
```

`a5doc.yml` が作成されます。

## 目次の作成

github や gitlab の wiki では、\_Sidebar.md に記述された内容が、サイドバーに表示される仕様となっています。
この\_Sidebar.md の作成をツールが行います。

見出しの作成方法は、2 つあります。

- ディレクトリ名を目次にする dirnameIndexer を使う
- 見出しの作成を細かく指定する chapterIndexer を使う

### dirnameIndexer

シンプルに、ディレクトリ名で目次を作成します。  
目次作成のデフォルトが dirnameIndexer なので、設定なしでも実行できますが、
a5doc.yml に設定すると以下のようになります。

```yml
# ドキュメントのルートディレクトリ
docroot: ./example/docs
# _Sidebar作成
sidebar:
  # 対象文書の走査モジュール
  indexer: dirnameIndexer
```

目次作成コマンドを実行します。

```bash
a5doc sidebar
```

### chapterIndexer

見出しの順番を制御したり、目次に表示する内容を制御したい場合は、文書ファイルの走査方法を、指定することができます。

(Step.1)

a5doc.yml に目次作成方法を設定します。

```yml
# ドキュメントのルートディレクトリ
docroot: ./example/docs
# _Sidebar作成
sidebar:
  # 対象文書の走査モジュール
  indexer: chapterIndexer

# chapterIndexerの走査方法の設定
chapters:
  - title: Home
    src: home.md
  - title: 設計
    chapters:
      - title: ER図
        dir: 設計/テーブル定義
        src: "**/ER図*.md"
        collapse: true
      - title: テーブル定義
        dir: 設計/テーブル定義
        src:
          - "**/*.md"
          - "!**/ER図*.md"
        collapse: false
```

(Step.2)

a5doc.yml に設定を追加したら、以下のコマンドで生成します。

```bash
a5doc sidebar
```

上記の a5doc.yml で生成した場合の実行結果のサンプルは、[./example/docs/\_Sidebar.md](./example/docs/_Sidebar.md)です。

## テーブル定義の作成

MD でテーブル定義を書いてみるとわかるのだが、表が異常に書きづらいです。  
excel で書いた方が、よほど生産的なのだけれど、テキストで管理したいので、テーブル定義の MD は自動生成することにして、テーブル定義に必要な情報を yml で作成します。  
MD のテーブルのフォーマット処理も施されているので、テキストエディタで MD のまま見ても十分に読み取れます。  
リポジトリには、yml ファイルも一緒にコミットしておきます。

(Step.1)

a5doc.yml にテーブル定義の作成方法を設定します。

```yml
table:
  src:
    - ./example/.a5doc/table/**/*.yml # (1)
  tableMdDir: ./example/docs/設計/テーブル定義 # (2)
```

- (1) yml で書いたファイルを指定。複数指定可能。
- (2) 出力先のディレクトリ

(Step.2)

yml でテーブルの仕様を記述します。

例

```yml
id: m_account # (1)
name: アカウント # (2)
category: master # (3)
description: | # (4)
  アカウントを管理するテーブル。  
  テーブルの該当に関する説明をここに記述する。この記述自体がMDで書ける。
  * 注意事項１
  * 注意事項２
  * 注意事項３

columns: # (5)
  id: # (5-1)
    name: ID # (5-2)
    type: long # (5-3)
    autoIncrement: true # (5-4)

  login_id:
    name: ログインID
    type: varchar
    length: 100

  account_name:
    name: 名前
    type: varchar
    length: 32
    notNull: false # (5-5)
    desc: |
      アカウント名が登録されていないときには、
      ログインIDをアカウント名として使用する

  company_id:
    name: 会社ID
    type: long

  deleted_at:
    name: 削除日時
    type: datetime

primary: # (6)
  - id

indexes: # (7)
  uk_login_id: # (7-1)
    type: unique # (7-2)
    columns: # (7-3)
      - login_id
      - deleted_at

foreignKeys: # (8)
  fk_dept_company: # (8-1)
    columns: [company_id] # (8-2)
    references: # (8-3)
      tableId: m_company # (8-3-1)
      columns: [id] # (8-3-2)
    relationType: 1N:1 # (8-4)
```

- (1) テーブル名（物理名）
- (2) テーブル名（論理名）
- (3) カテゴリ
- (4) 概要（MD 記法で記入）
- (5) カラムの仕様
  - (5-1) カラム名（物理名）
  - (5-2) カラム名（論理名）
  - (5-3) 型
  - (5-4) 長さ
  - (5-5) NOT NULL 制約 (false=NULL 可。デフォルト=true)
- (6) プライマリーキー
- (7) インデックス
  - (7-1) インデックス名
  - (7-2) インデックスのタイプ（unique が指定可能。デフォルト=非 unique）
  - (7-3) カラム名
- (8) 外部キー
  - (8-1) 外部キー名
  - (8-2) カラム名
  - (8-3) 参照先
    - (8-3-1) テーブル名
    - (8-3-2) カラム名
  - (8-4) 関係  
     以下のような書き方が出来ます。左右を逆にしても大丈夫です。
    - 1:1 ……… 1 対 1
    - 1:01 ……… 1 対 0 or 1
    - 1:N ……… 1 対 多
    - 1:0N ……… 1 対 0 or 多
    - 1:1N ……… 1 対 1 or 多

(Step.3)

以下のコマンドで、テーブル定義の MD を作成します。

```
a5doc table
```

自動生成された MD の出力サンプルは、[example/docs/設計/テーブル定義/アカウント.md](example/docs/設計/テーブル定義/アカウント.md)にあります。

## ER 図の作成

PlantUML で記述された ER 図を作成します。  
テーブル定義の yml の中で、FK の定義を書いておくと、それを読み取って、ER 図の MD ファイルを作成します。  
テーブル数が多すぎると、PlantUML がうまくレイアウトしてくれないこともあるので、いくつかのグループに分けて、ER 図を作成するとよいと思います。

(Step.1)

a5doc.yml に ER 図の作成方法を設定します。

```yml
table:
  erd:
    - id: ER-001
      docTitle: ER図（全体）
      description: システム全体のER図
      path: ./example/docs/設計/テーブル定義/ER図-全体.md
      # 表示するテキスト形式
      # logical=論理名 | physical=物理名 | both=物理名+論理名
      labelType: logical
      # 作図するテーブルを指定
      entityPatterns:
        # id=テーブルIDの正規表現
        # columnType=表示するカラムタイプ
        # all=全カラムを表示 | no=カラムなし | pk=PKのみ | pk+uk=PKとUKのみ
        - id: .*
          columnType: no

    - id: ER-002
      docTitle: ER図（顧客）
      description: 顧客を中心にしたER図
      path: ./example/docs/設計/テーブル定義/ER図-顧客.md
      labelType: physical
      entityPatterns:
        - id: m_account.*
          columnType: pk
        - id: m_customer
          columnType: all

    - id: ER-003
      docTitle: ER図（アカウント）
      description: アカウント周辺のER図
      path: ./example/docs/設計/テーブル定義/ER図-アカウント.md
      labelType: both
      entityPatterns:
        - id: m_account.*
          columnType: all
```

(Step.2)

以下のコマンドで、テーブル定義の MD を作成します。

```
a5doc erd
```

自動生成された MD の出力サンプルは、[example/docs/設計/テーブル定義/ER 図-全体.md](example/docs/設計/テーブル定義/ER図-全体.md)、[ER 図-顧客.md](example/docs/設計/テーブル定義/ER図-顧客.md)、[ER 図-アカウント.md](example/docs/設計/テーブル定義/ER図-アカウント.md)を参照してください。

## Swagger.yml から API インターフェース仕様の MD を作成

API のインターフェース仕様を記述するのも、テーブル定義と同じように、yml で書いて MD に変換します。  
この場合の yml の書式は、Swagger Spec で、MD への変換は、[swagger-markdown](https://www.npmjs.com/package/swagger-markdown) を使います。

- swagger.yml の分割とマージ  
   swagger.yml は 1 つのファイルに記述することになっていますが、API の数が多くなってくると編集しづらいので、yml を分割して記述できるようになっています。

  例えば、ユーザーデータに関係した API は、`ユーザー.yml`に書いて、注文処理に関する API は、`注文.yml`と書いておくと、MD も`ユーザー.md`と`注文.md`の 2 つが作成されます。MD として閲覧するときにも、自分好みに整理することができます。

  そして、単純なマージ処理でしかありませんが、分割された yml を 1 つの swagger.yml(swagger.json)として出力することも可能です。

- 共通定義となる common.yml  
   実際に、いくつかの yml を書いてみると、気になるのが、重複した記述です。  
   VSCode などのエディタを使うと、swagger.yml の構文チェックをしてくれるので、分割された yml も、それ単独で swagger spec として正しい状態にしておきたいですが、そうすると、複数の yml で重複した定義をすることになります。  
   この状態を緩和する機能として、common.yml に共通部分を外だしすることができるようにしています。

(Step.1)

a5doc.yml に swagger からの MD 作成方法を設定します。

```yml
swagger:
  src: # (1)
    - 設計/API/**/*.yml
    - "!設計/API/swagger.yml"
    - "!設計/API/common.yml"
  dst: 設計/API # (2)
  common: 設計/API/common.yml # (3)
  merge: # (4)
    - 設計/API/swagger.yml
    - 設計/API/swagger.json
```

- (1) 分割された swagger spec の yml の検索パターン  
   同じディレクトリに swagger.yml を出力する場合は、`!`で除外しておく。  
   同じく、共通定義の common.yml も md 出力対象ではないので、`!`で除外しておく。
- (2) md の出力先ディレクトリ
- (3) 共通定義の yml
- (4) 1 つにマージした swagger spec の出力指定  
   yml と json の出力指定が可能。

(Step.2)

以下のコマンドで、テーブル定義の MD を作成します。

```
a5doc swagger
```

## PDF を出力

GitBook の機能を使って、PDF を出力します。  
gitbook の実行は、docker コンテナで実行していますので、あらかじめ、docker-compose が実行できる環境を準備してください。  
wiki を運営していくうちに、設計書では記事も多数含まれるようになります。  
wiki としてみるときと、pdf で出力するときの見出し（目次）は別々にしたいこともあるでしょう。
その場合には、sidebar を作成したときとは、別の chapterIndexer を指定することができます。

(Step.1)

PDF 専用の目次を設定します。

```
# PDF作成
gitbook:
  indexer: chapterIndexer
  $chaptersRef: pdfChapters

pdfChapters:
  - title: 設計
    dir: 設計
    src: "**/*.md"
```

(Step.2)

以下のコマンドで、gitbook 用の初期設定および目次ページを作成します。

```
a5doc gitbook
```

`.gitbook` フォルダの中に、gitbook を実行するための最小構成の設定ファイルが作成されます。  
`.gitbook/book.json`を開いて、 title と author を変更してください。

(Step.3)

以下のコマンドで、PDF を出力します。

```
npm run pdf
```

`.gitbook/book.pdf` に PDF が作成ています。

2 回目以降の PDF 出力は、目次の更新が必要ない場合は、 `npm run pdf` だけの実行で大丈夫です。  
目次の更新をする場合は、 `a5doc gitbook` を実行してください。（book.json は上書きされません）

### PDF のレイアウト調整に関する補足

※PDF のレイアウトを変更する必要がない場合は、読み飛ばして問題ありません。  
gitbook はテンプレート化されていて、プラグインでテーマを変更することができます。デフォルトのテーマは、こちら<https://github.com/GitbookIO/theme-default>が使われています。  
他のテーマを探して、npm で install するもよし、あるいは、デフォルトのテーマの \_layout をコピーして、そのファイルを編集することでも、調整可能です。ちょっとだけ変更するなら、こっちの方が、良いかもしれません。

(Step.1)

デフォルトテーマを持ってきて、ドキュメントのディレクトリにコピーします。

```bash
# cloneして、_layoutをコピーします
mkdir tmp
cd tmp
git clone https://github.com/GitbookIO/theme-default.git .
cp -r _layout ${MY_PROJECT_DOCROOT}

# _layout以外は不要なので削除します
cd ..
rm -rf tmp

# PDF作成にしかgitbookを使わない場合は、ebookフォルダ以外は不要なので削除します。
cd ${MY_PROJECT_DOCROOT}/_layout
rm -rf website layout.html
```

※ \${MY_PROJECT_DOCROOT}は、自分のプロジェクトのドキュメントのルートディレクトリを指しています。

(Step.2)

目次ページを変更する場合のポイントについて、説明します。  
修正するファイルは、`_layout/ebook/summary.html`です。  
例えば、ページ番号を出力しないようにする場合は、以下のとおりです。

```twig
{% extends "./page.html" %}

{% block title %}{{ "SUMMARY"|t }}{% endblock %}

{% macro articles(_articles) %}
    {% for article in _articles %}
        <li>
            <!--
             (ポイント1)
             ここで style="border: none;" にすると下線が無くなります。
            -->
            <span class="inner" style="border: none;">
                {% if article.path or article.url %}
                    {% if article.path %}
                        <a href="{{ article.path|contentURL }}{{ article.anchor }}">{{ article.title }}</a>
                    {% else %}
                        <a target="_blank" href="{{ article.url }}">{{ article.title }}</a>
                    {% endif %}
                {% else %}
                    <span>{{ article.title }}</span>
                {% endif %}
                <!--
                 (ポイント2)
                 if 0 にしてページ番号の出力が実行されないようにします
                -->
                {% if 0 %}
                <span class="page">{{ article.level }}</span>
                {% endif %}
            </span>
            {% if article.articles.length > 0 %}
            <ol>
                {{ articles(article.articles) }}
            </ol>
            {% endif %}
        </li>
    {% endfor %}
{% endmacro %}

・・・

```

(Step.3)

ヘッダーを変更する場合のポイントについて、説明します。  
修正するファイルは、`_layout/ebook/pdf_header.html`です。  
例えば、ページ番号を右端に出力させてみます。  
gitbook のテンプレートで使える変数については、以下を参照してください。
<https://toolchain.gitbook.com/templating/variables.html>

```twig
{% extends "./page.html" %}

{% block body %}
<div class="pdf-header">
    <span>{{ page.title }}</span>
    <!-- (ポイント) 以下を追加します -->
    <span style="float: right;">Page {{ page.num }}</span>
</div>
{% endblock %}
```

(Step.4)

フッターを変更する場合のポイントについて、説明します。  
修正するファイルは、`_layout/ebook/pdf_footer.html`です。  
例えば、左端に著者を出力させてみます。

```twig
{% extends "./page.html" %}

{% block body %}
<div class="pdf-footer">
    <!-- (ポイント) 以下を追加します -->
    <span>{{ config.title }}</span>
    <span class="footer-pages-count">{{ page.num }}</span>
</div>
{% endblock %}
```

(Step.5)

SUMMARY の書き方について、補足します。  
page.title には、SUMMARY.md に書いたリンクテキストが入っています。  
例えば、以下のようなリンクが書かれているとします。

```md
# Summary

- 設計
  - ER 図
    - [アカウント](設計/テーブル定義/ER図-アカウント.md)
```

この場合、リンクテキストが、"アカウント"なので、`ER図-アカウント.md`の文書の`page.title`には"アカウント"が入ります。  
ファイル名でも、文書内の最初の見出しでもありません。

ちなみに、文書内に front-matter を書き込むこともできます。  
front-matter で定義された変数は、 `page.xxx` で参照することができます。  
ただし、残念ながらヘッダーとフッターには展開されません。

それから、もう 1 つ、ハマりそうな事として、リンクテキストを章を跨いで同じ文字列で使ってしまうと、2 つ目以降の文書のヘッダーやフッターで 2 重に出力されてしまいます。（おそらく ebook コンバーターのバグだと思います）  
以下のような場合に、このバグに遭遇します。

```md
# Summary

- 設計
  - ER 図
    - [アカウント](設計/テーブル定義/ER図-アカウント.md)
  - テーブル定義
    - [アカウント](設計/テーブル定義/アカウント.md)
```

ER 図とテーブル定義の別々の章に"アカウント"があります。  
こうなっていると、テーブル定義の方のアカウントのページのヘッダーで page.title が使われていると、"アカウントアカウント"と 2 重に出力されます。  
今のところ、対応方法は、 "リンクテキストを重複しないようにする" です。

## 文書内の TOC を更新

markdown には、目次の表示機能はありません。  
wiki で文書先頭に文書内の見出しで目次が欲しい場合には、自力でリンクを配置する必要があります。  
そして、目次のメンテナンスは、よく忘れてしまうので、一括で目次更新するコマンドを用意しました。

(Step.1)

目次を配置したい文書内に、拡張タグ<toc>を埋め込みます。
※<toc>タグは、markdown 的に及び html 的にも意味のないタグなので、副作用はありません。

例： test.md

```md
<toc> <!-- このような感じで、中身は空で大丈夫です -->
</toc> <!-- 開始タグと終了タグの両方とも行頭から記述してください -->

## 索引 1

・・・
・・・

### 1.1. 見出し A

・・・
・・・

#### 1.1.1. 小見出し

・・・
・・・

## 索引 2

・・・
・・・
```

(Step.2)

以下のコマンドで、<toc>タグ内に、索引が作成されます。

```
a5doc toc
```

例： 実行後の test.md

```md
<toc>

- [索引 1](#索引-1)
  - [1.1. 見出し A](#1.1.-見出し-A)
- [索引 2](#索引-2)

</toc>

## 索引 1

・・・
・・・

### 1.1. 見出し A

・・・
・・・

#### 1.1.1. 小見出し

・・・
・・・

## 索引 2

・・・
・・・
```

### `<toc>`のオプション

- **src**
  外部のファイルを見出しとして検索します。検出されたファイルは、さらに文書内の見出し抽出を行って、目次に展開されます。
  複数のパターンを指定する場合は、`|`で区切ってください。また、先頭に`!`がある場合は除外パターンになります。
- **depth**
  目次に出力するレベルを md 内の見出しレベルで指定します。  
   1 から始まる数値です。  
   "# 見出し" の場合は、depth=1 で、 "### 見出し" の場合は、depth=3 です。
  指定しない場合は、全部出力されます。
- **level**
  目次に出力する階層レベルを 0 から始まる数値で指定します。指定しない場合は、全部出力されます。  
   文書内の最小 depth を 0 として数えます。以下の例では、最小 depth=2 なので level は 0 ～ 2 となります。

  ```md
  ## 大見出し・・・・・・・・・・・・level=0, depth=2

  ### 中見出し・・・・・・・・・・・・level=1, depth=3

  #### 小見出し・・・・・・・・・・・・level=2, depth=4
  ```

- **desc**  
   true | false が設定できます。デフォルトは true です。  
   true の場合、外部文書に front-matter が設定してあって、 description のプロパティが設定されていた場合には、見出しの次の行に description の内容を出力します。
- **category**  
   true | false が設定できます。デフォルトは true です。  
   true の場合、カテゴリー構造をツリー式に出力します。

### 外部文書を TOC として作成

上記の`<toc>`のオプションで、src を指定することで、外部ファイルを見出しにすることができます。

例

```md
<toc src="./設計/**/*.md|!./設計/目次.md" level="2">
</toc>
```

## カテゴリーからパンくずリストを作成

markdown には、パンくずリストの表示機能はありません。  
wiki でパンくずリストがあると、文書間の移動が楽になるのになぁと思ったことがあると思いますが、TOC と同じく自力でリンクを配置するのは、面倒なので、一括でパンくずリストを更新するコマンドを用意しました。

(Step.1)

パンくずリストを配置したい文書内に、拡張タグ<breadcrumb>を埋め込みます。
※<breadcrumb>タグは、markdown 的に及び html 的にも意味のないタグなので、副作用はありません。

例： アカウント登録.md

```md
<breadcrumb></breadcrumb>
```

(Step.2)

以下のコマンドで、<breadcrumb>タグ内に、パンくずリストが作成されます。

```
a5doc breadcrumb
```

作成されるパンくずリストは、先頭が Home へのリンクで、次に文書のカテゴリーでリンクを配置します。最後は、自文書のタイトルがリンクなしで出力されます。

パンくず例

```md
[Home](../../home.md) \> [設計](../index.md) \> 画面仕様 \> アカウント登録画面
```

カテゴリは、文書内に front-matter で category プロパティを設定している場合は、それが使われます。 front-matter が無いときには、ディレクトリ名をカテゴリとして扱います。

カテゴリーとしてリンクされる文書は、そのカテゴリーを代表するページということで、ファイル名が "index.md" あるいは、 "README.md" になっているか、文書名が "目次" あるいは、"インデックス" になっているものが、カテゴリを代表する文書となります。そういう文書が見つからない場合は、リンクは配置されません。

## リンク切れチェックと修正

以下のコマンドで、リンク切れのチェックを実行します。

```
a5doc link-check
```

以下のコマンドで、リンクのスラッグの自動修正を行います。  
ただし、リンク先のヘッダーがあって、リンクのスラッグが typo している場合だけ、自動修正されます。

```
a5doc fix-link
```

## 文書に Front-matter を付ける

md ファイルに Front-matter を付けます。

途中まで書いてある md のファイル群に、一括で Front-matter を付けます。
ある程度、書き溜まったファイルに、あとから、Front-matter を付けるのは、それはそれで、面倒なので、コマンドで一括処理します。

追加される Front-matter のプロパティは、次のように、 title と category です。

```
---
title: ファイル名
category: ["ディレクトリ名", "サブディレクトリ名"]
---
```

title は、ファイル名を設定します。
category には、ディレクトリ名を設定します。

すでに、 Front-matter が付いている md ファイルは、何もしません。

以下のコマンドで、Front-matter を付けます。

```
a5doc front-matter
```
