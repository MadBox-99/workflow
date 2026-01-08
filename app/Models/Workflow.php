<?php

namespace App\Models;

use Cron\CronExpression;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'name',
        'description',
        'is_active',
        'is_scheduled',
        'schedule_cron',
        'last_run_at',
        'next_run_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_scheduled' => 'boolean',
            'last_run_at' => 'datetime',
            'next_run_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Check if this workflow should run now based on cron schedule.
     */
    public function shouldRunNow(): bool
    {
        if (! $this->is_scheduled || ! $this->schedule_cron) {
            return false;
        }

        try {
            $cron = new CronExpression($this->schedule_cron);

            return $cron->isDue();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Update schedule timestamps after a run.
     */
    public function markAsRun(): void
    {
        $nextRunAt = $this->calculateNextRunAt();

        $this->update([
            'last_run_at' => now(),
            'next_run_at' => $nextRunAt,
        ]);
    }

    /**
     * Calculate the next run time based on cron expression.
     */
    public function calculateNextRunAt(): ?\Carbon\Carbon
    {
        if (! $this->schedule_cron) {
            return null;
        }

        try {
            $cron = new CronExpression($this->schedule_cron);

            return \Carbon\Carbon::instance($cron->getNextRunDate());
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get human-readable description of the cron schedule.
     */
    public function getScheduleDescriptionAttribute(): ?string
    {
        return self::describeCron($this->schedule_cron);
    }

    /**
     * Get human-readable description for a cron expression.
     */
    public static function describeCron(?string $cron): ?string
    {
        if (! $cron) {
            return null;
        }

        return match ($cron) {
            '* * * * *' => 'Percenként',
            '*/5 * * * *' => '5 percenként',
            '*/10 * * * *' => '10 percenként',
            '*/15 * * * *' => '15 percenként',
            '*/30 * * * *' => '30 percenként',
            '0 * * * *' => 'Óránként',
            '0 */4 * * *' => '4 óránként',
            '0 */12 * * *' => '12 óránként',
            '0 0 * * *' => 'Naponta egyszer',
            default => $cron,
        };
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(WorkflowNode::class);
    }

    public function connections(): HasMany
    {
        return $this->hasMany(WorkflowConnection::class);
    }
}
