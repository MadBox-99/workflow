<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->boolean('is_scheduled')->default(false)->after('is_active');
            $table->unsignedInteger('schedule_interval')->nullable()->after('is_scheduled'); // in minutes
            $table->timestamp('last_run_at')->nullable()->after('schedule_interval');
            $table->timestamp('next_run_at')->nullable()->after('last_run_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn(['is_scheduled', 'schedule_interval', 'last_run_at', 'next_run_at']);
        });
    }
};
