<?php

namespace App\Modules\Shared\Traits;

trait ApiResponse
{
    protected function success($data = null, string $message = 'Success', int $code = 200)
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $code);
    }

    protected function created($data = null, string $message = 'Created successfully')
    {
        return $this->success($data, $message, 201);
    }

    protected function error(string $message = 'Error', int $code = 400, $errors = null)
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    protected function notFound(string $message = 'Data tidak ditemukan')
    {
        return $this->error($message, 404);
    }

    protected function validationError($errors)
    {
        return $this->error('Validation failed', 422, $errors);
    }
}
