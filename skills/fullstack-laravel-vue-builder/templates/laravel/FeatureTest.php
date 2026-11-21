<?php

namespace Tests\Feature;

use App\Models\{Thing};
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class {Thing}Test extends TestCase
{
    use RefreshDatabase;

    private function as(string $role): User
    {
        $user = User::factory()->create(['role' => $role]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_viewer_reads_but_cannot_create(): void
    {
        $this->as('viewer');
        $this->getJson('/api/{things}')->assertOk();
        $this->postJson('/api/{things}', ['code' => 'X1', 'name' => 'X', 'price' => 1])->assertForbidden();
    }

    public function test_staff_creates_and_duplicate_code_is_refused(): void
    {
        $this->as('staff');
        $this->postJson('/api/{things}', ['code' => 'X1', 'name' => 'X', 'price' => 10])
            ->assertCreated()->assertJsonPath('data.code', 'X1');
        $this->postJson('/api/{things}', ['code' => 'X1', 'name' => 'Y', 'price' => 10])
            ->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_only_owner_deletes(): void
    {
        $thing = {Thing}::create(['code' => 'X1', 'name' => 'X', 'price' => 1, 'status' => 'inactive']);
        $this->as('staff');
        $this->deleteJson("/api/{things}/{$thing->id}")->assertForbidden();
        $this->as('owner');
        $this->deleteJson("/api/{things}/{$thing->id}")->assertOk();
        $this->assertSoftDeleted($thing);
    }
}
