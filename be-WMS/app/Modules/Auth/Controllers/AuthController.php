<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Modules\Auth\Services\AuthService;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * POST /api/auth/login
     */
    public function login(Request $request)
    {
        try {
            $result = $this->authService->login($request->only('username', 'password'));

            if (!$result) {
                return $this->error('Username atau password salah', 401);
            }

            // Log activity
            ActivityLog::log(
                'login',
                'auth',
                'User ' . ($result['user']['name'] ?? 'unknown') . ' berhasil login',
            );

            return $this->success($result, 'Login berhasil');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    /**
     * POST /api/auth/logout
     */
    public function logout()
    {
        $this->authService->logout();

        return $this->success(null, 'Logout berhasil');
    }

    /**
     * POST /api/auth/refresh
     */
    public function refresh()
    {
        $result = $this->authService->refresh();

        return $this->success($result, 'Token refreshed');
    }

    /**
     * GET /api/auth/me
     */
    public function me()
    {
        $user = $this->authService->getProfile();

        return $this->success($user);
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $this->authService->updateProfile(
                $request->only('name', 'phone', 'address')
            );

            return $this->success($user, 'Profile berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    /**
     * PUT /api/auth/change-password
     */
    public function changePassword(Request $request)
    {
        try {
            $result = $this->authService->changePassword($request->only(
                'current_password',
                'new_password',
                'new_password_confirmation'
            ));

            if (!$result) {
                return $this->error('Password saat ini salah', 422);
            }

            return $this->success(null, 'Password berhasil diubah');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }
}
