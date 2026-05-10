<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Services\UserManagementService;
use App\Modules\Shared\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected UserManagementService $userService
    ) {}

    public function index()
    {
        $users = $this->userService->getAll();

        return $this->success($users, 'Data user berhasil diambil');
    }

    public function store(Request $request)
    {
        try {
            $user = $this->userService->create($request->all());

            return $this->created($user, 'User berhasil ditambahkan');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function show(int $id)
    {
        $user = $this->userService->getById($id);

        if (!$user) {
            return $this->notFound('User tidak ditemukan');
        }

        return $this->success($user);
    }

    public function update(Request $request, int $id)
    {
        try {
            $user = $this->userService->update($id, $request->all());

            if (!$user) {
                return $this->notFound('User tidak ditemukan');
            }

            return $this->success($user, 'User berhasil diupdate');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        }
    }

    public function destroy(int $id)
    {
        $result = $this->userService->delete($id);

        if ($result === null) {
            return $this->notFound('User tidak ditemukan');
        }

        if ($result === false) {
            return $this->error('Tidak dapat menghapus akun sendiri', 422);
        }

        return $this->success(null, 'User berhasil dihapus');
    }

    public function resetPassword(Request $request, int $id)
    {
        $request->validate([
            'new_password' => 'required|string|min:6',
        ]);

        $result = $this->userService->resetPassword($id, $request->new_password);

        if (!$result) {
            return $this->notFound('User tidak ditemukan');
        }

        return $this->success(null, 'Password user berhasil direset');
    }
}
