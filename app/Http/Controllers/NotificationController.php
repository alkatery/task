<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return Notification::where('user_id', $request->user()->id)
            ->latest()->limit(50)->get();
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id === $request->user()->id) {
            $notification->update(['is_read' => true]);
        }
        return response()->json(['message' => 'تم']);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->update(['is_read' => true]);
        return response()->json(['message' => 'تم']);
    }
}
