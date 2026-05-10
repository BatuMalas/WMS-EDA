<?php

namespace App\Modules\Shared\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

trait LogsActivity
{
    /**
     * Log an activity from the current module.
     */
    protected function logActivity(
        string $action,
        string $module,
        string $description,
        ?Model $subject = null,
        ?array $properties = null
    ): ActivityLog {
        return ActivityLog::log($action, $module, $description, $subject, $properties);
    }
}
