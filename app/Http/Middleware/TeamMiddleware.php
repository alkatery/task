<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TeamMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!in_array($request->user()?->role, ['admin', 'team'])) {
            return response()->json(['error' => 'غير مصرح'], 403);
        }
        return $next($request);
    }
}
