#!/bin/bash
echo "🚀 更新專案中..."
git pull
npm run build
pm2 restart agatha-seminar
echo "✅ 更新完成！"
