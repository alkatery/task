<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::select('id', 'name', 'email', 'role', 'avatar', 'is_active', 'created_at')
            ->orderBy('role')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:users']);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password ?? '123456'),
            'role' => $request->role ?? 'team',
        ]);

        return response()->json($user->only('id', 'name', 'email', 'role'), 201);
    }

    public function update(Request $request, User $user)
    {
        $user->update($request->only('name', 'email', 'role', 'is_active'));
        return response()->json(['message' => 'تم التحديث']);
    }

    public function resetPassword(Request $request, User $user)
    {
        $user->update(['password' => Hash::make($request->password ?? '123456')]);
        return response()->json(['message' => 'تم إعادة تعيين كلمة المرور']);
    }
}
