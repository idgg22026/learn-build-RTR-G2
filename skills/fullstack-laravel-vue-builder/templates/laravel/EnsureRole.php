<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Route::middleware('role:owner,staff')
     * Checked on every request, so a removed login stops working at once, even on a page that is already open.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_active) {
            if ($user && $request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
            }

            abort(401, 'Please log in.');
        }

        if (! in_array($user->role, $roles, true)) {
            abort(403, 'You do not have permission to do this.');
        }

        return $next($request);
    }
}
