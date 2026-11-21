<?php

namespace App\Services;

use App\Models\{Thing};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Business rules for {Thing}. Controllers call these methods; nothing else changes {things}.
 * Write the rules here as comments first, then the code.
 */
class {Thing}Service
{
    public function create(array $data): {Thing}
    {
        return DB::transaction(function () use ($data) {
            // 1. guard clauses → ValidationException::withMessages(['field' => 'Clear message.'])
            // 2. lock rows other users could change at the same time: Model::lockForUpdate()->findOrFail($id)
            // 3. write; copy (snapshot) any number a bill/receipt depends on
            return {Thing}::create($data);
        });
    }

    public function remove({Thing} $thing): void
    {
        if ($thing->status === 'active') {
            throw ValidationException::withMessages(['{thing}' => 'Cannot delete an active {THING_LABEL}.']);
        }

        $thing->delete(); // soft delete; money records are voided instead, never deleted
    }
}
