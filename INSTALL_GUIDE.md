# =============================================
# دليل تثبيت منصة إدارة العمليات
# للفريق التقني / فريق السيرفر
# =============================================

## المتطلبات الأساسية
- PHP >= 8.1 مع الإضافات: mbstring, xml, curl, mysql, zip, bcmath
- Composer 2
- MySQL 5.6+ أو MariaDB 10.0+
- Node.js >= 18 + npm (لبناء الواجهة)
- خادم ويب: Nginx أو Apache

## خطوات التثبيت

### ١. رفع المشروع على السيرفر

```bash
# فك الضغط
cd /home/ia/public_html/tasks/
tar -xzf ops-platform-laravel.tar.gz

# الدخول لمجلد المشروع
cd laravel-platform
```

### ٢. تثبيت حزم PHP

```bash
composer install --no-dev --optimize-autoloader
```

### ٣. إعداد ملف البيئة

```bash
cp .env.example .env
php artisan key:generate
```

ثم عدّل ملف `.env`:

```bash
nano .env
```

وغيّر القيم التالية:

```
APP_URL=https://yourdomain.com
APP_ENV=production
APP_DEBUG=false

DB_DATABASE=ops_platform
DB_USERNAME=اسم_مستخدم_قاعدة_البيانات
DB_PASSWORD=كلمة_مرور_قاعدة_البيانات
```

### ٤. إنشاء قاعدة البيانات

```bash
mysql -u root -p
```

```sql
CREATE DATABASE ops_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

أو من cPanel: أنشئ قاعدة بيانات جديدة باسم `ops_platform` بترميز `utf8mb4_unicode_ci`.

### ٥. تشغيل جداول قاعدة البيانات

```bash
php artisan migrate
```

### ٦. إضافة البيانات الأولية

```bash
php artisan db:seed
```

هذا الأمر ينشئ:
- ٩ مستخدمين (المدير + ٨ أعضاء فريق)
- ٩ مسارات عمل مبرمجة

### ٧. ربط مجلد التخزين

```bash
php artisan storage:link
```

### ٨. بناء واجهة React

```bash
cd client
npm install
npm run build
cd ..

# نسخ الملفات المبنية إلى مجلد Laravel العام
mkdir -p public/client
cp -r client/build/* public/client/
```

### ٩. ضبط الصلاحيات

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
# أو إذا كان Apache:
# chown -R apache:apache storage bootstrap/cache
```

### ١٠. تحسين الأداء (إنتاج)

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## إعداد Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /home/ia/public_html/tasks/laravel-platform/public;
    index index.php;
    charset utf-8;
    client_max_body_size 50M;

    location /storage {
        alias /home/ia/public_html/tasks/laravel-platform/storage/app/public;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## إعداد Apache (.htaccess)

الملف موجود تلقائياً في مجلد `public/`.
تأكد من تفعيل `mod_rewrite`:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

ووجّه DocumentRoot إلى مجلد `public/`:
```
DocumentRoot /home/ia/public_html/tasks/laravel-platform/public
```

---

## بيانات الدخول الافتراضية

| المستخدم | البريد | كلمة المرور | الدور |
|----------|--------|-------------|-------|
| سعيد | saeed@ops.local | 123456 | مدير (admin) |
| شادي زينه | shadi@ops.local | 123456 | فريق |
| راغد | raghad@ops.local | 123456 | فريق |
| عبدالرحمن | abdulrahman@ops.local | 123456 | فريق |
| مؤمن | moamen@ops.local | 123456 | فريق |
| مجد | majd@ops.local | 123456 | فريق |
| محمد زينه | mzeina@ops.local | 123456 | فريق |
| أنس | anas@ops.local | 123456 | فريق |
| فريق مصر | egypt@ops.local | 123456 | فريق |

⚠️ يجب تغيير كلمات المرور فوراً بعد أول تسجيل دخول.

---

## حل المشاكل الشائعة

### خطأ 500
```bash
# تحقق من السجلات
tail -f storage/logs/laravel.log

# أعد بناء الكاش
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### خطأ في الصلاحيات
```bash
chmod -R 775 storage bootstrap/cache
```

### خطأ في قاعدة البيانات
```bash
# إعادة بناء كاملة
php artisan migrate:fresh --seed
```

### الواجهة لا تظهر
تأكد من:
1. نسخ `client/build/*` إلى `public/client/`
2. ملف `routes/web.php` يوجّه إلى `public/client/index.html`
