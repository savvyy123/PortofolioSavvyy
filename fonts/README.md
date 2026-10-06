# fonts

ポートフォリオサイトで使うフォント。元ファイルは `~/Library/Fonts` からコピーしたもの。

| 用途 | フォント | フォルダ | ファイル数 |
|---|---|---|---|
| 英語（ロゴの「Ishikawa Sota」を含む） | Neue Haas Grotesk Display Round（Commercial Type） | `en/NeueHaasGrotDispRound/` | 16（XXThin〜Black、各イタリック付き） |
| 日本語 | AXIS Std（タイププロジェクト） | `ja/AxisStd/` | 7（UltraLight〜Heavy） |

## ウェイト対応表

### Neue Haas Grotesk Display Round

| 番号 | ウェイト | CSS の font-weight（目安） |
|---|---|---|
| 15 / 16 | XXThin / Italic | 100 |
| 25 / 26 | XThin / Italic | 150 |
| 35 / 36 | Thin / Italic | 200 |
| 45 / 46 | Light / Italic | 300 |
| 55 / 56 | Roman / Italic | 400 |
| 65 / 66 | Medium / Italic | 500 |
| 75 / 76 | Bold / Italic | 700 |
| 95 / 96 | Black / Italic | 900 |

### AXIS Std

| ファイル | CSS の font-weight（目安） |
|---|---|
| UltraLight | 100 |
| ExtraLight | 200 |
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| Bold | 700 |
| Heavy | 900 |

## 注意

- **Neue Haas は体験版（Trial）**。収録文字は英数字と一部の記号（`! " ' , - . ? ‘ ’ “ ”`）だけで、`& / : @ ( )` などは入っていない。サイトを公開する前に、製品版と Web 用ライセンスが必要かを Commercial Type の条件で確認する
- **AXIS Std を Web で使うには Web 用のライセンスが別に必要**かを確認する。1 ファイル約 1.9MB あるので、使う文字だけにサブセット化して WOFF2 に変換してから読み込む
- Git（公開リポジトリ）には、サイトで使っているフォントだけを入れている（2026-10-06 に本人判断で公開）：Display Round 55 Roman（名前・見出し）/ Display Round 45 Light（nav）/ Display 55 Roman（top の作品タイトル。`en/NeueHaasGrotDisp/`）/ AXIS Std Light（作品情報）。ほかのウェイトは `.gitignore` で除外。ライセンスの確認は上の 2 点のとおり残っている
