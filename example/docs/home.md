# A5 顧客管理システム

wiki では、home.md が TOP ページになるので作成しておく。
少なくとも、システムのタイトルを書いて作成する。

<toc src="./**/*.md|!./*.md" level="3" depth="4">

- test
  - [toc.md](test/toc)
    - [索引 1](test/toc#索引-1)
      - [1.1. 見出し A](test/toc#11-見出し-A)
      - [1.2. 見出し (B)](<test/toc#12-見出し-(B)>)
    - [索引 2](test/toc#索引-2)
    - [外部ファイルの索引](test/toc#外部ファイルの索引)
- 設計
  - API
    - [pet.md](設計/API/pet)
      - [Swagger Petstore](設計/API/pet#Swagger-Petstore)
    - [store.md](設計/API/store)
      - [Swagger Petstore](設計/API/store#Swagger-Petstore)
    - [user.md](設計/API/user)
      - [Swagger Petstore](設計/API/user#Swagger-Petstore)
  - テーブル定義
    - [ER 図-アカウント.md](設計/テーブル定義/ER図-アカウント)
    - [ER 図-全体.md](設計/テーブル定義/ER図-全体)
    - [ER 図-顧客.md](設計/テーブル定義/ER図-顧客)
    - [アカウント.md](設計/テーブル定義/アカウント)
      - [概要](設計/テーブル定義/アカウント#概要)
      - [テーブル](設計/テーブル定義/アカウント#テーブル)
      - [インデックス](設計/テーブル定義/アカウント#インデックス)
    - [アカウント権限.md](設計/テーブル定義/アカウント権限)
      - [テーブル](設計/テーブル定義/アカウント権限#テーブル)
    - [顧客.md](設計/テーブル定義/顧客)
      - [テーブル](設計/テーブル定義/顧客#テーブル)
      - [インデックス](設計/テーブル定義/顧客#インデックス)
- 機能設計
  - [顧客登録機能](設計/機能/client-func)  
     これは顧客登録機能の概要で toc の見出しにも出力される
    - [front-matter の説明](設計/機能/client-func#front-matterの説明)

</toc>

toc の src で `!` にしたページは見出しに出力されない。
