<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workflow;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $pass = Hash::make('123456');

        // =============================================
        // المستخدمون
        // =============================================
        $users = [
            ['name' => 'سعيد', 'email' => 'saeed@ops.local', 'role' => 'admin'],
            ['name' => 'شادي زينه', 'email' => 'shadi@ops.local', 'role' => 'team'],
            ['name' => 'راغد', 'email' => 'raghad@ops.local', 'role' => 'team'],
            ['name' => 'عبدالرحمن', 'email' => 'abdulrahman@ops.local', 'role' => 'team'],
            ['name' => 'مؤمن', 'email' => 'moamen@ops.local', 'role' => 'team'],
            ['name' => 'مجد', 'email' => 'majd@ops.local', 'role' => 'team'],
            ['name' => 'محمد زينه', 'email' => 'mzeina@ops.local', 'role' => 'team'],
            ['name' => 'أنس', 'email' => 'anas@ops.local', 'role' => 'team'],
            ['name' => 'فريق مصر', 'email' => 'egypt@ops.local', 'role' => 'team'],
        ];

        foreach ($users as $u) {
            User::create(array_merge($u, ['password' => $pass]));
        }

        // =============================================
        // مسارات العمل
        // =============================================

        Workflow::create([
            'name' => 'المسار الأساسي - إنتاج المحتوى',
            'slug' => 'main-production',
            'description' => 'المسار الرئيسي من المونتاج إلى النشر على جميع المنصات',
            'steps' => [
                ['order' => 0, 'name' => 'المونتاج', 'default_assignee' => 'shadi@ops.local', 'type' => 'task'],
                ['order' => 1, 'name' => 'تركيب جرافيك ورفع يوتيوب', 'default_assignee' => 'raghad@ops.local', 'type' => 'task'],
                ['order' => 2, 'name' => 'تفرع', 'type' => 'fork', 'branches' => ['benefits', 'platforms']],
            ],
        ]);

        Workflow::create([
            'name' => 'مسار الفوائد',
            'slug' => 'benefits',
            'description' => 'استخراج الفوائد وتصميمها ونشرها',
            'steps' => [
                ['order' => 0, 'name' => 'استخراج الفوائد', 'default_assignee' => 'abdulrahman@ops.local', 'type' => 'task'],
                ['order' => 1, 'name' => 'اعتماد الفوائد من العميل', 'type' => 'approval', 'approver' => 'client'],
                ['order' => 2, 'name' => 'تركيب جرافيك الفوائد', 'default_assignee' => 'raghad@ops.local', 'type' => 'task'],
                ['order' => 3, 'name' => 'تصميم غلاف الفائدة', 'default_assignee' => 'moamen@ops.local', 'type' => 'task'],
                ['order' => 4, 'name' => 'جدولة النشر', 'default_assignee' => 'majd@ops.local', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'مسار المنصات',
            'slug' => 'platforms',
            'description' => 'نشر المحتوى على جميع المنصات',
            'steps' => [
                ['order' => 0, 'name' => 'تصميم غلاف يوتيوب', 'default_assignee' => 'moamen@ops.local', 'type' => 'task'],
                ['order' => 1, 'name' => 'إضافة الغلاف على يوتيوب', 'default_assignee' => 'majd@ops.local', 'type' => 'task'],
                ['order' => 2, 'name' => 'نشر الدروس على الموقع', 'default_assignee' => 'mzeina@ops.local', 'type' => 'task'],
                ['order' => 3, 'name' => 'نشر على المنصات', 'default_assignee' => 'majd@ops.local', 'type' => 'task'],
                ['order' => 4, 'name' => 'نشر على المنصات الصوتية', 'default_assignee' => 'egypt@ops.local', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'رفع التفريغ على Apple Books',
            'slug' => 'apple-books',
            'description' => 'رفع الوحدات الموضوعية المكتملة على Apple Books',
            'steps' => [
                ['order' => 0, 'name' => 'تجهيز ورفع Apple Books', 'default_assignee' => 'egypt@ops.local', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'فهرسة يوتيوب',
            'slug' => 'youtube-index',
            'description' => 'إضافة فهرسة للفيديوهات على يوتيوب',
            'steps' => [
                ['order' => 0, 'name' => 'تجهيز وإضافة الفهرسة', 'default_assignee' => 'egypt@ops.local', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'التفريغ النصي',
            'slug' => 'transcription',
            'description' => 'تفريغ الدروس نصياً ومراجعتها',
            'steps' => [
                ['order' => 0, 'name' => 'التفريغ النصي', 'type' => 'task', 'tool' => 'mufarrigh'],
                ['order' => 1, 'name' => 'المراجعة والتنسيق', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'إعادة مونتاج الإنتاج القديم',
            'slug' => 'remontage',
            'description' => 'إعادة مونتاج المواد القديمة ورفعها',
            'steps' => [
                ['order' => 0, 'name' => 'إعادة المونتاج', 'default_assignee' => 'mzeina@ops.local', 'type' => 'task'],
                ['order' => 1, 'name' => 'رفع يوتيوب والمنصات', 'default_assignee' => 'mzeina@ops.local', 'type' => 'task'],
                ['order' => 2, 'name' => 'فهرسة ومنصة صوتية', 'default_assignee' => 'egypt@ops.local', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'برمجة منصة جديدة',
            'slug' => 'new-platform',
            'description' => 'مشروع متعدد المراحل لبناء منصة جديدة',
            'steps' => [
                ['order' => 0, 'name' => 'تصميم شعار', 'type' => 'task'],
                ['order' => 1, 'name' => 'تجهيز هوية وألوان', 'type' => 'task'],
                ['order' => 2, 'name' => 'مراجعة الشيخ للتقسيمات', 'type' => 'approval', 'approver' => 'client'],
                ['order' => 3, 'name' => 'متابعة البرمجة', 'type' => 'task'],
                ['order' => 4, 'name' => 'إضافة المواد', 'type' => 'task'],
                ['order' => 5, 'name' => 'التسليم والإطلاق', 'type' => 'task'],
            ],
        ]);

        Workflow::create([
            'name' => 'طلبات جرافيك جديد',
            'slug' => 'new-graphic',
            'description' => 'طلب تصميم جرافيك جديد مع اعتماد العميل',
            'steps' => [
                ['order' => 0, 'name' => 'إنشاء الطلب', 'type' => 'task'],
                ['order' => 1, 'name' => 'التصميم', 'type' => 'task'],
                ['order' => 2, 'name' => 'ملاحظات العميل', 'type' => 'approval', 'approver' => 'client'],
                ['order' => 3, 'name' => 'التسليم النهائي', 'type' => 'task'],
            ],
        ]);
    }
}
