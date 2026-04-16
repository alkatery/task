<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    public function index()
    {
        return Client::where('is_active', true)
            ->withCount([
                'projects as active_projects' => fn($q) => $q->where('status', 'active'),
                'tasks as pending_tasks' => fn($q) => $q->whereNotIn('status', ['completed', 'cancelled']),
            ])
            ->with('user:id,name')
            ->orderBy('name')->get();
    }

    public function show(Client $client)
    {
        $client->load([
            'projects' => fn($q) => $q->latest(),
            'tasks' => fn($q) => $q->with('assignee:id,name')->latest()->limit(50),
        ]);
        return $client;
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required']);

        $userId = null;

        // إنشاء حساب بوابة العميل
        if ($request->contact_email) {
            $existing = User::where('email', $request->contact_email)->first();
            if (!$existing) {
                $portalUser = User::create([
                    'name' => $request->name,
                    'email' => $request->contact_email,
                    'password' => Hash::make('client123'),
                    'role' => 'client',
                ]);
                $userId = $portalUser->id;
            }
        }

        $client = Client::create([
            'name' => $request->name,
            'type' => $request->type ?? 'sheikh',
            'contact_name' => $request->contact_name,
            'contact_phone' => $request->contact_phone,
            'contact_email' => $request->contact_email,
            'notes' => $request->notes,
            'user_id' => $userId,
        ]);

        return response()->json(['id' => $client->id, 'name' => $client->name], 201);
    }

    public function update(Request $request, Client $client)
    {
        $client->update($request->only('name', 'type', 'contact_name', 'contact_phone', 'contact_email', 'notes'));
        return response()->json(['message' => 'تم التحديث']);
    }
}
