<?php
// routes/api.php: grouped by PERMISSION LEVEL, not by feature

use App\Http\Controllers\AuthController;
use App\Http\Controllers\{Thing}Controller;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware(['throttle:5,1', 'log.activity']);

Route::middleware(['auth:sanctum', 'role:owner,staff,viewer,member', 'log.activity'])->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    // ---------- Self-service role: only their own data ----------
    Route::middleware('role:member')->prefix('portal')->group(function () {
        // Route::get('home', [PortalController::class, 'home']);
    });

    // ---------- READ: owner, staff, viewer ----------
    Route::middleware('role:owner,staff,viewer')->group(function () {
        Route::get('{things}', [{Thing}Controller::class, 'index']);
        Route::get('{things}/{{thing}}', [{Thing}Controller::class, 'show']);
    });

    // ---------- WORK: owner, staff ----------
    Route::middleware('role:owner,staff')->group(function () {
        Route::post('{things}', [{Thing}Controller::class, 'store']);
        Route::match(['put', 'patch'], '{things}/{{thing}}', [{Thing}Controller::class, 'update']);
    });

    // ---------- OWNER ONLY: delete, settings, money corrections, logins ----------
    Route::middleware('role:owner')->group(function () {
        Route::delete('{things}/{{thing}}', [{Thing}Controller::class, 'destroy']);
    });
});
