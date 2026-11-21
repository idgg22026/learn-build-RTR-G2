<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class {Thing} extends Model
{
    use SoftDeletes;

    // One place for allowed values: used by Rule::in(), resources and the Vue dropdown
    public const STATUSES = ['active', 'inactive'];

    protected $fillable = ['code', 'name', 'price', 'status', 'notes'];

    protected $attributes = ['status' => 'active'];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // public function parent(): BelongsTo { return $this->belongsTo(Parent::class)->withTrashed(); }
    // public function children(): HasMany { return $this->hasMany(Child::class); }
}
