#!/bin/bash
# ============================================
# 热处理管理系统 - 数据库自动备份脚本
# 用法: bash scripts/backup-db.sh
# ============================================
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/heat_treatment_${TIMESTAMP}.sql.gz"
RETAIN_DAYS=30  # 保留30天

mkdir -p "$BACKUP_DIR"

echo "📦 开始备份数据库..."

# 优先用 Railway CLI，其次用直连
if command -v railway &> /dev/null && [ -n "$RAILWAY_TOKEN" ]; then
  echo "   通过 Railway CLI 连接..."
  railway run pg_dump --clean --if-exists --no-owner \
    | gzip > "$BACKUP_FILE"
elif [ -n "$DATABASE_URL" ]; then
  echo "   通过 DATABASE_URL 直连..."
  pg_dump "$DATABASE_URL" --clean --if-exists --no-owner \
    | gzip > "$BACKUP_FILE"
else
  echo "❌ 无法连接数据库。请设置 DATABASE_URL 或 RAILWAY_TOKEN"
  exit 1
fi

SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "✅ 备份完成: $BACKUP_FILE ($SIZE)"

# 清理旧备份
echo "🧹 清理 $RETAIN_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETAIN_DAYS -delete

echo "📋 当前备份列表:"
ls -lh "$BACKUP_DIR" | tail -5

echo ""
echo "📍 备份文件位置: $(pwd)/$BACKUP_FILE"
