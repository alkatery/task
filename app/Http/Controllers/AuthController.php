<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'بيانات دخول خاطئة'], 401);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->only('id', 'name', 'email', 'role', 'avatar')
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->only('id', 'name', 'email', 'role', 'avatar', 'created_at'));
    }

    public function changePassword(Request $request)
    {
        $request->validate(['current' => 'required', 'newPassword' => 'required|min:6']);

        if (!Hash::check($request->current, $request->user()->password)) {
            return response()->json(['error' => 'كلمة المرور الحالية خاطئة'], 400);
        }

        $request->user()->update(['password' => Hash::make($request->newPassword)]);

        return response()->json(['message' => 'تم تغيير كلمة المرور']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'تم تسجيل الخروج']);
    }
}
