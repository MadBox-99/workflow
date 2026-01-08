<?php

namespace App\Models;

use App\Observers\TeamObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[ObservedBy(TeamObserver::class)]
class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'owner_id',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function emailTemplates(): HasMany
    {
        return $this->hasMany(EmailTemplate::class);
    }

    public function scheduleOptions(): BelongsToMany
    {
        return $this->belongsToMany(ScheduleOption::class)->withTimestamps();
    }

    public function availableScheduleOptions()
    {
        return $this->scheduleOptions()->active()->ordered();
    }

    public function googleCredential(): HasOne
    {
        return $this->hasOne(TeamGoogleCredential::class);
    }

    public function hasGoogleCalendarConnected(): bool
    {
        return $this->googleCredential !== null;
    }
}
