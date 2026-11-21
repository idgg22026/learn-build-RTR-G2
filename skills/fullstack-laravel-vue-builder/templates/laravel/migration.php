<?php
// php artisan make:migration create_{things}_table
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('{things}', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20);                         // human id, e.g. A101
            $table->string('name', 100);
            $table->decimal('price', 10, 2)->default(0);        // USD → decimal; riel/cents → unsignedBigInteger
            $table->string('status', 20)->default('active');    // values in {Thing}::STATUSES
            // $table->foreignId('parent_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('code'); // uniqueness among non-deleted rows is checked in the FormRequest
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('{things}');
    }
};
