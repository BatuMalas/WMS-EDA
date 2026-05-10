<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class UserManagementService
{
    public function getAll()
    {
        return User::select('id', 'name', 'username', 'email', 'role', 'phone', 'address', 'created_at')
            ->latest()
            ->get();
    }

    public function getById(int $id)
    {
        return User::select('id', 'name', 'username', 'email', 'role', 'phone', 'address', 'created_at')
            ->find($id);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'nullable|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:manajer,petugas',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return User::create($data);
    }

    public function update(int $id, array $data)
    {
        $user = User::find($id);

        if (!$user) {
            return null;
        }

        $validator = Validator::make($data, [
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $id,
            'email' => 'nullable|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:manajer,petugas',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user->update($data);

        return $user->fresh();
    }

    public function delete(int $id)
    {
        $user = User::find($id);

        if (!$user) {
            return null;
        }

        // Prevent deleting self
        if (auth()->id() === $user->id) {
            return false;
        }

        $user->delete();

        return true;
    }

    public function resetPassword(int $id, string $newPassword)
    {
        $user = User::find($id);

        if (!$user) {
            return null;
        }

        $user->update(['password' => $newPassword]);

        return $user;
    }
}
