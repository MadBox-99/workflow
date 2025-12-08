<?php

namespace App\Observers;

use App\Models\Team;
use Illuminate\Support\Str;

class TeamObserver
{
    public function creating(Team $team): void
    {
        if (empty($team->slug)) {
            $team->slug = Str::slug($team->name);
        }
    }
}
