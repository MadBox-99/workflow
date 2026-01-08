<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->string('schedule_cron')->nullable()->after('is_scheduled');
        });

        // Convert existing schedule_interval values to cron expressions
        DB::table('workflows')->whereNotNull('schedule_interval')->get()->each(function ($workflow) {
            $cron = match ($workflow->schedule_interval) {
                1 => '* * * * *',
                5 => '*/5 * * * *',
                10 => '*/10 * * * *',
                15 => '*/15 * * * *',
                30 => '*/30 * * * *',
                60 => '0 * * * *',
                120 => '0 */2 * * *',
                360 => '0 */6 * * *',
                720 => '0 */12 * * *',
                1440 => '0 0 * * *',
                default => "*/{$workflow->schedule_interval} * * * *",
            };

            DB::table('workflows')->where('id', $workflow->id)->update(['schedule_cron' => $cron]);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn('schedule_interval');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->unsignedInteger('schedule_interval')->nullable()->after('is_scheduled');
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn('schedule_cron');
        });
    }
};
