<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| واجهة React الأمامية
|--------------------------------------------------------------------------
| بعد بناء React (npm run build) ونسخ الملفات إلى public/client/
| هذا الـ Route يخدم التطبيق لجميع المسارات
|--------------------------------------------------------------------------
*/

Route::get('/{any}', function () {
    $indexPath = public_path('client/index.html');

    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }

    return response()->json([
        'message' => 'المنصة قيد الإعداد. تأكد من بناء واجهة React ونسخها إلى public/client/',
        'steps' => [
            '1. cd client && npm install && npm run build',
            '2. mkdir -p public/client && cp -r client/build/* public/client/',
        ]
    ], 503);
})->where('any', '^(?!api).*$');
