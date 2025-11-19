# デプロイ手順

## Vercelへのデプロイ方法

### オプション1: Vercel CLI (コマンドライン)

1. Vercelにログイン:
```bash
vercel login
```
ブラウザで https://vercel.com/device を開き、表示されたコードを入力

2. デプロイ:
```bash
vercel --prod
```

### オプション2: Vercel Web UI (推奨・簡単)

1. https://vercel.com にアクセスしてログイン
2. 「Add New」→「Project」をクリック
3. GitHubリポジトリをインポート（事前にGitHubにpush必要）
4. プロジェクト設定:
   - Framework Preset: Other
   - Build Command: (空欄)
   - Output Directory: public
5. 「Deploy」をクリック

### GitHubにプッシュ

```bash
# GitHubで新しいリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/swingby-simulator.git
git branch -M main
git push -u origin main
```

## ローカルでのテスト

```bash
# 方法1: Pythonの簡易サーバー
./test-local.sh

# 方法2: Node.jsのserve
npm install -g serve
serve public

# 方法3: Vercelの開発サーバー
vercel dev
```

ブラウザで http://localhost:8000 (または表示されたURL) を開く

## 注意事項

- `vercel.json`で`public`ディレクトリを公開設定済み
- 静的サイトなのでビルド不要
- デプロイ後、自動的にHTTPSが有効化されます
