<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials)
    {
        $validator = Validator::make($credentials, [
            'username' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $token = Auth::guard('api')->attempt([
            'username' => $credentials['username'],
            'password' => $credentials['password'],
        ]);

        if (!$token) {
            return null;
        }

        return $this->respondWithToken($token);
    }

    public function logout()
    {
        Auth::guard('api')->logout();
    }

    public function refresh()
    {
        $token = Auth::guard('api')->refresh();

        return $this->respondWithToken($token);
    }

    public function getProfile()
    {
        return Auth::guard('api')->user();
    }

    public function updateProfile(array $data)
    {
        $user = Auth::guard('api')->user();

        $validator = Validator::make($data, [
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user->update($data);

        return $user->fresh();
    }

    public function changePassword(array $data)
    {
        $validator = Validator::make($data, [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $user = Auth::guard('api')->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return false;
        }

        $user->update([
            'password' => $data['new_password'],
        ]);

        return true;
    }

    protected function respondWithToken(string $token): array
    {
        $user = Auth::guard('api')->user();

        return [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'address' => $user->address,
            ],
        ];
    }
}
