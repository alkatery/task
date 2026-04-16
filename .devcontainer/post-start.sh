#!/usr/bin/env bash
# =============================================
# post-start: يُشغَّل عند بدء Codespace
# =============================================

# التأكد من وجود قاعدة البيانات
if [ ! -f database/database.sqlite ]; then
    touch database/database.sqlite
    php artisan migrate --force
    php artisan db:seed --force
fi

# عرض التعليمات
echo ""
echo "=========================================="
echo "  منصة العمليات جاهزة للتشغيل"
echo "=========================================="
echo ""
echo "  Backend (Laravel):"
echo "    php artisan serve --host=0.0.0.0 --port=8000"
echo ""
echo "  Frontend (React):"
echo "    cd client && npm start"
echo ""
echo "  تسجيل الدخول:"
echo "    saeed@ops.local / 123456"
echo "=========================================="
