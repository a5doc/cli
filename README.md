a5doc
=====

MDで仕様書を作成することをサポートするためのツールです。

SphinxやGitBookなど、テキストでドキュメントを管理するツールは、すでに、いくつもありますが、それらのツールは、MDファイルをソースとして、htmlやpdfに変換してドキュメントを作成しますが、a5docは`MDファイルを作成することをサポートする`ツールです。  

作成されたMDファイルは、githubやgitlabのwikiに、そのままコミットして、wikiで仕様書を参照すること、あるいはテキストエディタで仕様書を読むことを目的にしています。  

a5docは、WEBサーバー機能を持っているわけではなくて、単純にMDファイルの補正と作成をするだけなので、SphinxやGitBookなどの実行になんら影響を与えません。  
普段は、wikiで仕様書を書いて、HTMLで公開するとかPDFでドキュメントを納品するときなどには、その目的に適したSphinxやGitBookを使うのが、よいと思います。  

* [はじめに](#install)
* [目次の作成](#_Sidebar)（_Sidebar.mdとして出力）
* [テーブル定義の作成](#table)
* [ER図の作成](#erd)
* 文書内のTOCを更新 ・・・・・・・・・・・・・・・未実装
* MD仕様書から用語の抽出・・・・・・・・・・・・・未実装
* GLOSSARYの作成・・・・・・・・・・・・・・・・・未実装
* 用語のスペルチェック（リンク切れチェック）・・・未実装
* 章のナンバリング・・・・・・・・・・・・・・・・未実装
* CRUD表の作成・・・・・・・・・・・・・・・・・・未実装

<a name="install"></a>
## はじめに
```bash
# インストール
npm install -g a5doc

# 初期設定
a5doc init
```

<a name="_Sidebar"></a>
## 目次の作成

githubやgitlabのwikiでは、_Sidebar.mdに記述された内容が、サイドバーに表示される仕様となっています。
この_Sidebar.mdの作成をツールが行います。

見出しの作成方法は、2つあります。
* シンプルにディレクトリ名を目次にする
* 見出しの作成を細かく指定するchapterIndexer

### シンプルにディレクトリ名を目次にする

特に設定は不要です。
```bash
a5doc sidebar
```

### 見出しの作成を細かく指定するchapterIndexer

見出しの順番を制御したり、目次に表示する内容を制御したい場合は、文書ファイルを走査方法を、指定することができます。

(Step.1)

a5doc.ymlに目次作成方法を設定します。  
```yml
# ドキュメントのルートディレクトリ
docroot: ./example/docs
# サイドバー作成
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

a5doc.ymlに設定を追加したら、以下のコマンドで生成します。

```bash
a5doc sidebar
```

上記のa5doc.ymlで生成した場合の実行結果は、[./example/docs/_Sidebar.md](./example/docs/_Sidebar.md)です。

<a name="table"></a>
## テーブル定義の作成

MDでテーブル定義を書いてみるとわかるのだが、表が異常に書きづらいです。  
excelで書いた方が、よほど生産的なのだけれど、テキストで管理したいので、テーブル定義のMDは自動生成することにして、テーブル定義に必要な情報をymlで作成します。  
MDのテーブルのフォーマット処理も施されているので、テキストエディタでMDのまま見ても十分に読み取れます。  
リポジトリには、ymlファイルも一緒にコミットしておきます。

(Step.1)

a5doc.ymlにテーブル定義の作成方法を設定します。  
```yml
table:
  src:
    - ./example/.a5doc/table/**/*.yml           # (1) 
  tableMdDir: ./example/docs/設計/テーブル定義  # (2) 
```
* (1) ymlで書いたファイルを指定。複数指定可能。
* (2) 出力先のディレクトリ

(Step.2)

ymlでテーブルの仕様を記述します。

例
```yml
id:          m_account      # (1)
name:        アカウント     # (2)
category:    master         # (3)
description: |              # (4)
  アカウントを管理するテーブル。  
  テーブルの該当に関する説明をここに記述する。この記述自体がMDで書ける。
  * 注意事項１
  * 注意事項２
  * 注意事項３

columns:                    # (5)
  id:                       # (5-1)
    name:          ID       # (5-2)
    type:          long     # (5-3)
    autoIncrement: true     # (5-4)

  login_id:
    name:          ログインID
    type:          varchar
    length:        100

  account_name:
    name:          名前
    type:          varchar
    length:        32
    notNull:       false     # (5-5)

  company_id:
    name:          会社ID
    type:          long

  deleted_at:
    name:          削除日時
    type:          datetime

primary:                     # (6)        
  - id

indexes:                     # (7)
  uk_login_id:               # (7-1)
    type: unique             # (7-2)
    columns:                 # (7-3)
      - login_id
      - deleted_at

foreignKeys:                 # (8)
  fk_dept_company:           # (8-1)
    columns: [company_id]    # (8-2)
    references:              # (8-3)
      tableId: m_company     # (8-3-1)
      columns: [id]          # (8-3-2)
    relationType: 1N:1       # (8-4)

```

* (1) テーブル名（物理名）
* (2) テーブル名（論理名）
* (3) カテゴリ
* (4) 概要（MD記法で記入）
* (5) カラムの仕様
    * (5-1) カラム名（物理名）
    * (5-2) カラム名（論理名）
    * (5-3) 型
    * (5-4) 長さ
    * (5-5) NOT NULL制約 (false=NULL可。デフォルト=true)
* (6) プライマリーキー
* (7) インデックス
    * (7-1) インデックス名
    * (7-2) インデックスのタイプ（uniqueが指定可能。デフォルト=非unique）
    * (7-3) カラム名
* (8) 外部キー
    * (8-1) 外部キー名
    * (8-2) カラム名
    * (8-3) 参照先
        * (8-3-1) テーブル名
        * (8-3-2) カラム名
    * (8-4) 関係  
        以下のような書き方が出来ます。左右を逆にしても大丈夫です。
        * 1:1  ……… 1 対 1
        * 1:01 ……… 1 対 0 or 1
        * 1:N  ……… 1 対 多
        * 1:0N ……… 1 対 0 or 多
        * 1:1N ……… 1 対 1 or 多

(Step.3)

以下のコマンドで、テーブル定義のMDを作成します。  
```
a5doc table
```

自動生成されたMDの出力サンプルは、[example/docs/設計/テーブル定義/アカウント.md](example/docs/設計/テーブル定義/アカウント.md)にあります。

<a name="erd"></a>
## ER図の作成

PlantUMLで記述されたER図を作成します。  
テーブル定義のymlの中で、FKの定義を書いておくと、それを読み取って、ER図のMDファイルを作成します。  
テーブル数が多すぎると、PlantUMLがうまくレイアウトしてくれないこともあるので、いくつかのエリアに分けて、ER図が作成できるようにしています。

(Step.1)

a5doc.ymlにER図の作成方法を設定します。  
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
      description: アカウント
      path: ./example/docs/設計/テーブル定義/ER図-アカウント.md
      labelType: both
      entityPatterns: 
        - id: m_account.*
          columnType: all
```

(Step.2)

以下のコマンドで、テーブル定義のMDを作成します。  
```
a5doc erd
```

自動生成されたMDの出力サンプルは、[example/docs/設計/テーブル定義/ER図-全体.md](example/docs/設計/テーブル定義/ER図-全体.md)、[ER図-顧客.md](example/docs/設計/テーブル定義/ER図-顧客.md)、[ER図-アカウント.md](example/docs/設計/テーブル定義/ER図-アカウント.md)を参照してください。

