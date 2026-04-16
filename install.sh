#!/bin/bash
# =============================================
# سكريبت تثبيت منصة إدارة العمليات
# نفّذ هذا الملف بصلاحيات root
# =============================================

set -e

echo "=========================================="
echo "  تثبيت منصة إدارة العمليات"
echo "=========================================="

# =============================================
# 1. المتغيرات — عدّلها حسب السيرفر
# =============================================
APP_DIR="/home/ia/public_html/tasks/laravel-platform"
DB_NAME="ops_platform"
DB_USER="root"
DB_PASS=""
APP_URL="https://yourdomain.com"
# إذا كان المستخدم مختلف عن root:
# DB_USER="ops_user"
# DB_PASS="your_password"

echo ""
echo "[1/8] تثبيت حزم PHP (Composer)..."
cd "$APP_DIR"
composer install --no-dev --optimize-autoloader --no-interaction 2>&1

echo ""
echo "[2/8] إعداد ملف البيئة (.env)..."
if [ ! -f .env ]; then
    cp .env.example .env
    # تحديث إعدادات قاعدة البيانات
    sed -i "s|DB_DATABASE=ops_platform|DB_DATABASE=$DB_NAME|g" .env
    sed -i "s|DB_USERNAME=root|DB_USERNAME=$DB_USER|g" .env
    sed -i "s|DB_PASSWORD=|DB_PASSWORD=$DB_PASS|g" .env
    sed -i "s|APP_URL=http://localhost:8000|APP_URL=$APP_URL|g" .env
    sed -i "s|APP_ENV=local|APP_ENV=production|g" .env
    sed -i "s|APP_DEBUG=true|APP_DEBUG=false|g" .env
    echo "  ✓ تم إنشاء .env"
else
    echo "  ⚠ ملف .env موجود مسبقاً، لم يتم تعديله"
fi

echo ""
echo "[3/8] توليد مفتاح التطبيق..."
php artisan key:generate --force 2>&1

echo ""
echo "[4/8] إنشاء قاعدة البيانات..."
mysql -u "$DB_USER" $([ -n "$DB_PASS" ] && echo "-p$DB_PASS") -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 || echo "  ⚠ تأكد من إنشاء قاعدة البيانات يدوياً"

echo ""
echo "[5/8] تشغيل Migrations..."
php artisan migrate --force 2>&1

echo ""
echo "[6/8] إضافة البيانات الأولية (الفريق + المسارات)..."
php artisan db:seed --force 2>&1

echo ""
echo "[7/8] ربط مجلد التخزين..."
php artisan storage:link 2>&1 || echo "  ⚠ الرابط موجود مسبقاً"

echo ""
echo "[8/8] ضبط الصلاحيات وتحسين الأداء..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || chown -R apache:apache storage bootstrap/cache 2>/dev/null || echo "  ⚠ اضبط صلاحيات storage يدوياً"

php artisan config:cache 2>&1
php artisan route:cache 2>&1
php artisan view:cache 2>&1

echo ""
echo "=========================================="
echo "  ✅ تم التثبيت بنجاح!"
echo "=========================================="
echo ""
echo "  بيانات الدخول:"
echo "  البريد: saeed@ops.local"
echo "  كلمة المرور: 123456"
echo ""
echo "  ⚠ غيّر كلمات المرور فوراً بعد أول دخول"
echo "=========================================="
