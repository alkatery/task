# منصة إدارة العمليات — Laravel 9 + React

## نظرة عامة
منصة متكاملة لإدارة عمليات إنتاج المحتوى الرقمي مبنية على **Laravel 9** (Backend) و **React** (Frontend).

### الميزات
- **٩ مسارات عمل** مبرمجة مع تقدم تلقائي بين المراحل
- **محرك مهام** ذكي يربط المهام بالمسارات والمسؤولين
- **بوابة عملاء** خارجية للاعتماد والمتابعة وإضافة الملاحظات
- **أداة مُفرّغ** للتفريغ النصي بتنسيق إسلامي (Groq Whisper + LLM)
- **تقارير شاملة**: أداء الفريق، نقاط الاختناق، المتأخرات، حالة العملاء
- **٣ مستويات صلاحيات**: مدير (admin) · عضو فريق (team) · عميل (client)
- **تنبيهات تلقائية** عند تعيين المهام وانتقال المراحل

## المتطلبات
- PHP 8.1+
- Composer 2+
- MySQL 5.6+
- Node.js 18+ (لبناء واجهة React)
- مفتاح Groq API (اختياري، لأداة التفريغ)

## التثبيت

### 1. استنساخ المشروع وتثبيت الحزم
```bash
cd /opt
tar -xzf ops-platform-laravel.tar.gz
cd laravel-platform

# تثبيت حزم PHP
composer install --no-dev --optimize-autoloader

# تثبيت وبناء واجهة React
cd client && npm install && npm run build && cd ..

# نسخ ملفات البناء لمجلد Laravel العام
cp -r client/build public/client
```

### 2. إعداد البيئة
```bash
cp .env.example .env
php artisan key:generate

# عدّل ملف .env بإعدادات قاعدة البيانات
nano .env
```

### 3. قاعدة البيانات
```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE ops_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# تشغيل الـ Migrations
php artisan migrate

# إضافة البيانات الأولية (الفريق + المسارات)
php artisan db:seed
```

### 4. ربط مجلد التخزين
```bash
php artisan storage:link
```

### 5. التشغيل
```bash
# وضع التطوير
php artisan serve    # Backend على :8000
cd client && npm start  # Frontend على :3000

# وضع الإنتاج (بعد بناء React ونسخه لـ public/client)
php artisan serve --host=0.0.0.0 --port=80
```

## بيانات الدخول الافتراضية

| المستخدم | البريد | كلمة المرور | الدور |
|----------|--------|-------------|-------|
| سعيد | saeed@ops.local | 123456 | مدير |
| شادي زينه | shadi@ops.local | 123456 | فريق |
| راغد | raghad@ops.local | 123456 | فريق |
| عبدالرحمن | abdulrahman@ops.local | 123456 | فريق |
| مؤمن | moamen@ops.local | 123456 | فريق |
| مجد | majd@ops.local | 123456 | فريق |
| محمد زينه | mzeina@ops.local | 123456 | فريق |
| أنس | anas@ops.local | 123456 | فريق |
| فريق مصر | egypt@ops.local | 123456 | فريق |

> ⚠️ غيّر كلمات المرور فوراً بعد أول تسجيل دخول

## الهيكل البرمجي
```
laravel-platform/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php          # تسجيل دخول وملف شخصي
│   │   │   ├── UserController.php          # إدارة المستخدمين
│   │   │   ├── ClientController.php        # إدارة العملاء
│   │   │   ├── WorkflowController.php      # عرض المسارات
│   │   │   ├── TaskController.php          # المهام + محرك المسارات
│   │   │   ├── TranscriptionController.php # مُفرّغ + Groq API
│   │   │   ├── ReportController.php        # التقارير
│   │   │   └── NotificationController.php  # التنبيهات
│   │   └── Middleware/
│   │       ├── AdminMiddleware.php         # صلاحية المدير
│   │       └── TeamMiddleware.php          # صلاحية الفريق
│   └── Models/                             # 9 Eloquent Models
├── config/                                 # إعدادات Laravel
├── database/
│   ├── migrations/                         # 3 ملفات Migration
│   └── seeders/DatabaseSeeder.php          # بيانات أولية
├── routes/
│   ├── api.php                             # جميع API endpoints
│   └── web.php                             # يخدم React SPA
├── client/                                 # React Frontend
│   └── src/pages/                          # 9 صفحات React
└── .env.example
```

## النشر على VPS (إنتاج)

### باستخدام Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /opt/laravel-platform/public;
    index index.php;
    charset utf-8;

    # React SPA - ملفات ثابتة
    location /client {
        try_files $uri $uri/ /client/index.html;
    }

    # Laravel API
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

### خطوات النشر الكاملة
```bash
# 1. تثبيت المتطلبات
sudo apt update
sudo apt install php8.1 php8.1-fpm php8.1-mysql php8.1-mbstring php8.1-xml php8.1-curl nginx mysql-server nodejs npm -y
sudo apt install composer -y

# 2. رفع المشروع
scp ops-platform-laravel.tar.gz user@server:/opt/

# 3. فك الضغط والإعداد
cd /opt && tar -xzf ops-platform-laravel.tar.gz && cd laravel-platform
composer install --no-dev --optimize-autoloader
cp .env.example .env && php artisan key:generate
nano .env  # عدّل إعدادات قاعدة البيانات

# 4. قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE ops_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate
php artisan db:seed
php artisan storage:link

# 5. بناء React
cd client && npm install && npm run build && cd ..
cp -r client/build public/client

# 6. الصلاحيات
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# 7. تحسين الأداء
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Nginx
sudo nano /etc/nginx/sites-available/ops-platform
# الصق إعدادات Nginx أعلاه
sudo ln -s /etc/nginx/sites-available/ops-platform /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## API Endpoints

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| POST | /api/auth/login | تسجيل الدخول | عام |
| GET | /api/auth/me | الملف الشخصي | مسجّل |
| GET | /api/tasks | قائمة المهام | مسجّل |
| POST | /api/tasks | إنشاء مهمة | فريق/مدير |
| GET | /api/tasks/{id} | تفاصيل مهمة | مسجّل |
| PUT | /api/tasks/{id}/status | تحديث الحالة | مسجّل |
| POST | /api/tasks/{id}/approve | اعتماد/مراجعة | مسجّل |
| POST | /api/tasks/{id}/comments | إضافة تعليق | مسجّل |
| GET | /api/tasks/stats/dashboard | إحصائيات لوحة التحكم | مسجّل |
| GET | /api/users | قائمة المستخدمين | مسجّل |
| POST | /api/users | إنشاء مستخدم | مدير |
| GET | /api/clients | قائمة العملاء | مسجّل |
| POST | /api/clients | إنشاء عميل | مدير |
| GET | /api/workflows | قائمة المسارات | مسجّل |
| POST | /api/transcriptions | رفع ملف صوتي | فريق/مدير |
| POST | /api/transcriptions/{id}/transcribe | بدء التفريغ | فريق/مدير |
| GET | /api/reports/* | التقارير | مدير |
| GET | /api/notifications | التنبيهات | مسجّل |

## المصادقة
المنصة تستخدم **Laravel Sanctum** للمصادقة عبر API tokens.

عند تسجيل الدخول عبر `/api/auth/login`، يُرجع token يُرسل مع كل طلب لاحق:
```
Authorization: Bearer {token}
```

## التقنيات
- **Backend**: Laravel 9 · PHP 8.1 · Laravel Sanctum · Eloquent ORM
- **Frontend**: React 18 · React Router 6
- **Database**: MySQL 5.6+ · utf8mb4 · InnoDB
- **تفريغ**: Groq Whisper Large v3 · LLama 3.3 70B
