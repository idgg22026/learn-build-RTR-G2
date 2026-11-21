<?php

namespace App\Http\Requests;

use App\Models\{Thing};
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Store{Thing}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true; // roles are checked by the route group (role:owner,staff)
    }

    // Arrays sent inside multipart FormData arrive as JSON strings
    // protected function prepareForValidation(): void
    // {
    //     if (is_string($this->input('lines'))) $this->merge(['lines' => json_decode($this->input('lines'), true) ?? []]);
    // }

    public function rules(): array
    {
        return [
            'code'   => ['required', 'string', 'max:20', Rule::unique('{things}', 'code')->whereNull('deleted_at')],
            // Update{Thing}Request: Rule::unique('{things}', 'code')->ignore($this->route('{thing}'))->whereNull('deleted_at')
            'name'   => ['required', 'string', 'max:100'],
            'price'  => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in({Thing}::STATUSES)],
            'notes'  => ['nullable', 'string', 'max:1000'],
            // 'photo' => ['nullable', 'image', 'max:5120'],
        ];
    }
}
