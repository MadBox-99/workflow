<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamGoogleCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'access_token',
        'refresh_token',
        'token_type',
        'expires_at',
        'scopes',
        'google_email',
    ];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'expires_at' => 'datetime',
            'scopes' => 'array',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at?->isPast() ?? true;
    }

    public function needsRefresh(): bool
    {
        return $this->expires_at?->subMinutes(5)->isPast() ?? true;
    }
}
