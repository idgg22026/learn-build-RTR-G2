<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class {Thing}Resource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'code'       => $this->code,
            'name'       => $this->name,
            'price'      => (float) $this->price,
            'status'     => $this->status,
            'notes'      => $this->notes,
            // 'photo_url' => \App\Support\PrivateFile::url($this->photo_path),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
