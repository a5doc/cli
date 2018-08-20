a5doc
=====

ドキュメントの作成をサポートするためのツール。

このツールでは、yamlで用語を定義したり、MD内から用語を抽出したりしながら、用語を管理して、その用語を使って、MDで書かれた仕様書の校正を行ったり、一部仕様書の自動生成を行います。

具体的には、こんなことをやりたいと思ってます。
* テーブル定義の作成
* MDで仕様書を書く
* 用語のスペルチェック（リンク切れチェック）
* 章のナンバリング
* 目次の作成
* CRUD表の作成
* GLOSSARYの作成

## テーブル定義

MDでテーブル定義を書いてみるとわかるのだが、MDで表を書くのが、非常にめんどくさいです。  
excelで書いた方が、よほど生産的なのだけれど、テキストで管理したいので、テーブル定義のMDは自動生成することにして、テーブル定義に必要な情報をyamlで作成します。  

サンプル  
example/.a5doc/table/アカウント.yml

## MD仕様書

仕様書をMDファイルで記述します。  
機能名や画面名は、MD内から正規表現で抽出します。  
画面IDや画面名といった、用語として、意味ある項目は、MDの中に埋め込んでおいてください。

例えば、以下のようなMDがあった場合、
```
> 画面ID: login  
> 画面名: ログイン画面  

# 1. 概要
ログイン認証のための画面。  

入力値から[アカウント][]マスタを検索し、認証できた場合に、ホーム画面に遷移する。

・・・・
```
画面IDおよび画面名を抽出する正規表現は次の通りです。
* 画面ID: `/$> 画面ID: ([^\s])/`
* 画面名: `/$> 画面名: ([^\s])/`

## ドキュメントの分類と章立て

ディレクトリ構成やファイル名で、章立てを管理できるようにします。  
章番号は、開発が進む中で、変わることがありますが、gitで管理するときに、rename すると履歴が追いづらいので、あまり、ディレクトリ名やファイル名には、章番号を含めたくないものです。  

設定ファイル `chapter.yml` は、ディレクトリあるいはファイル名のパターンで、ドキュメントを分類分けする機能です。

例えば、"画面仕様"を書いてあるMDファイルが、`./example/docs/ui` ディレクトリ配下にあって、"機能仕様"は`./example/docs/service` ディレクトリにあるものを一括りに分類するといった具合です。  

## 使い方




## 詳細

### a5doc.yml
a5docツールの設定
```
projectCode: a5doc-example
projectName: A5顧客管理システム

# テーブルのカラムについて、テーブル間で同名のカラムについて、
# 型と桁数が一致していることチェックする
columnNameConsistencyCheck: true;

table:
  src:
    - ./example/.a5doc/table/**/*.yml
  output:
    - ./example/doc/設計/テーブル

chapter: ./example/.a5doc/chapter.yml

```


### chapter.yml
ドキュメントの分類と章立て設定  
（例）
```
概要:
  chapter: 1
  title: システム概要
  pattern:
    - example/docs/システム概要/**/*.md

設計:
  chapter: 2
  title: 画面
  pattern:
    - example/docs/設計/目次.md

画面設計:
  chapter: 2.1
  title: 画面
  pattern:
    - example/docs/設計/画面/**/*.md

機能設計:
  chapter: 2.2
  title: 機能
  pattern:
    - example/docs/設計/機能/**/*.md
```
* chapter ‥‥‥ 章番号（ドットで章のレベルを指定する）
* title ‥‥‥‥ 目次に記載する章のタイトル  
* pattern ‥‥‥ 章内のドキュメントとして分類するファイルのパターン  
    [glob](https://ja.wikipedia.org/wiki/%E3%82%B0%E3%83%AD%E3%83%96)方式で指定します。  
    複数のパターンを指定可能。  

### 用語辞書仕様

テーブル定義や機能名、画面名などは、用語辞書として、一括管理して、名称だけで引き出せるようにします。
これは、外部定義されるものではなくて、内部的に、こんな仕様で管理していますということを、説明しています。  
```
{
  term: null,
  termType: null,
  termCategory: null,
  relation: {
    tableId: null,
    columnId: null,
  }
}
```
* term  
    用語
* termType  
    用語タイプ  
    - type.TABLE_ID ‥‥‥ テーブル物理名
    - type.TABLE_NAME ‥‥‥ テーブル論理名
    - type.COLUMN_ID ‥‥‥ カラム物理名
    - type.COLUMN_NAME ‥‥‥ カラム論理名
    - type.UI_ID ‥‥‥ 画面ID
    - type.UI_NAME ‥‥‥ 画面名
    - type.UI_ITEM_ID ‥‥‥ 画面項目ID [^1](#fn1)
    - type.UI_ITEM_LABEL ‥‥‥ 画面項目ラベル [^1](#fn1)
* termCategory  
    用語カテゴリー
    - category.TABLE ‥‥‥ テーブル
    - category.UI ‥‥‥ 画面

<a name="fn1"></a>
[^1]
画面項目は、項目ラベルと一致することが多いが、必ずしも一致するとは限らないので、一意に識別するIDが必要です。

