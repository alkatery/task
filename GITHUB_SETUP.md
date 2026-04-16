# تشغيل المنصة على GitHub

## الطريقة الأسهل: GitHub Codespaces

### خطوات التشغيل
1. افتح المستودع على GitHub
2. اضغط زر **Code** الأخضر → تبويب **Codespaces** → **Create codespace on main**
3. انتظر حتى يكتمل الإعداد التلقائي (يستغرق 3-5 دقائق)
   - تثبيت PHP 8.1 + Node.js 18
   - تثبيت حزم Composer و npm
   - إنشاء قاعدة بيانات SQLite
   - تشغيل Migrations و Seeders
4. عند الانتهاء ستُفتح VS Code في المتصفح

### تشغيل المنصة
افتح **Terminal** واختر إحدى الطرق:

#### الطريقة 1: VS Code Task (موصى بها)
```
Ctrl+Shift+P → Tasks: Run Task → Run Both (Laravel + React)
```

#### الطريقة 2: تيرمينالان يدوياً
**Terminal 1 (Backend):**
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

**Terminal 2 (Frontend):**
```bash
cd client && npm start
```

### الوصول للمنصة
- React Frontend سيُفتح تلقائياً على بورت **3000** (ستظهر معاينة في تبويب جديد)
- Laravel API على بورت **8000**
- Codespaces يحوّل البورتات تلقائياً إلى روابط HTTPS عامة

### بيانات الدخول الافتراضية
| البريد | كلمة المرور | الدور |
|--------|-------------|-------|
| saeed@ops.local | 123456 | مدير |
| shadi@ops.local | 123456 | فريق |

---

## قاعدة البيانات

على **Codespaces** تعمل المنصة بـ **SQLite** (ملف `database/database.sqlite`)
لتبسيط الإعداد. لتبديلها لـ MySQL:

1. عدّل `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ops_platform
DB_USERNAME=root
DB_PASSWORD=your_password
```

2. أنشئ القاعدة وشغّل Migrations:
```bash
php artisan migrate:fresh --seed
```

---

## GitHub Actions (CI)
يُنفَّذ تلقائياً عند كل Push أو PR على `main`:
- اختبار Backend (Laravel): Composer install → Migrate → Seed
- اختبار Frontend (React): npm install → build

راجع: `.github/workflows/ci.yml`

---

## النشر على استضافة خارجية
**GitHub Pages/Codespaces لا يدعمان استضافة PHP إنتاجياً**.
للنشر النهائي استخدم:
- **DigitalOcean / Linode / AWS**: VPS مع Nginx + PHP-FPM (راجع INSTALL_GUIDE.md)
- **Railway / Render**: نشر Laravel تلقائياً من المستودع
- **Laravel Forge / Ploi**: إدارة VPS احترافية

---

## استكشاف الأخطاء

### Codespace لم ينتهِ من الإعداد
```bash
bash .devcontainer/post-create.sh
```

### قاعدة البيانات فارغة
```bash
php artisan migrate:fresh --seed
```

### مشاكل الصلاحيات
```bash
chmod -R 775 storage bootstrap/cache
```

### تنظيف الكاش
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```
