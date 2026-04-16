#!/usr/bin/env bash
# =============================================
# post-create: يُشغَّل مرة واحدة بعد إنشاء Codespace
# =============================================
set -e

echo "=========================================="
echo "  إعداد منصة العمليات على Codespaces"
echo "=========================================="

# 1. تثبيت إضافات PHP المطلوبة
echo ""
echo "[1/8] تثبيت إضافات PHP و SQLite..."
sudo apt-get update -qq
sudo apt-get install -y -qq sqlite3 libsqlite3-dev php8.1-sqlite3 php8.1-mbstring php8.1-xml php8.1-curl php8.1-bcmath php8.1-zip

# 2. تثبيت حزم Composer
echo ""
echo "[2/8] تثبيت حزم PHP (Composer)..."
composer install --no-interaction --prefer-dist --optimize-autoloader

# 3. إعداد ملف البيئة
echo ""
echo "[3/8] إعداد ملف البيئة (.env)..."
if [ ! -f .env ]; then
    cp .env.example .env
    # استخدام SQLite بدلاً من MySQL لتسهيل التشغيل على Codespaces
    # نحذف إعدادات MySQL ونترك Laravel يستخدم database_path('database.sqlite') كافتراضي
    sed -i 's|DB_CONNECTION=mysql|DB_CONNECTION=sqlite|g' .env
    sed -i 's|^DB_HOST=.*||g' .env
    sed -i 's|^DB_PORT=.*||g' .env
    sed -i 's|^DB_DATABASE=.*||g' .env
    sed -i 's|^DB_USERNAME=.*||g' .env
    sed -i 's|^DB_PASSWORD=.*||g' .env
    echo "  ✓ تم إنشاء .env (قاعدة بيانات SQLite)"
else
    echo "  ⚠ ملف .env موجود مسبقاً"
fi

# 4. توليد مفتاح التطبيق
echo ""
echo "[4/8] توليد مفتاح التطبيق..."
php artisan key:generate --force

# 5. إنشاء قاعدة بيانات SQLite
echo ""
echo "[5/8] إنشاء قاعدة بيانات SQLite..."
touch database/database.sqlite

# 6. تشغيل Migrations + Seeders
echo ""
echo "[6/8] تشغيل Migrations و Seeders..."
php artisan migrate --force
php artisan db:seed --force

# 7. ربط مجلد التخزين
echo ""
echo "[7/8] ربط مجلد التخزين..."
php artisan storage:link 2>/dev/null || echo "  ⚠ الرابط موجود مسبقاً"

# 8. تثبيت حزم Node للـ React
echo ""
echo "[8/8] تثبيت حزم React..."
cd client
npm install --no-audit --no-fund
cd ..

echo ""
echo "=========================================="
echo "  ✅ تم الإعداد بنجاح!"
echo "=========================================="
echo ""
echo "  لتشغيل المنصة:"
echo "    Terminal 1: php artisan serve --host=0.0.0.0"
echo "    Terminal 2: cd client && npm start"
echo ""
echo "  بيانات الدخول:"
echo "    البريد: saeed@ops.local"
echo "    كلمة المرور: 123456"
echo "=========================================="
