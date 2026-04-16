<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    public function register() {}

    public function boot()
    {
        // MySQL 5.7: الحد الأقصى لطول الفهرس 767 bytes
        // utf8mb4 = 4 bytes × 191 = 764 bytes (آمن)
        Schema::defaultStringLength(191);
    }
}
