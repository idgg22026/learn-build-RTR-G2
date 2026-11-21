<?php

namespace App\Http\Controllers;

use App\Http\Requests\Store{Thing}Request;
use App\Http\Requests\Update{Thing}Request;
use App\Http\Resources\{Thing}Resource;
use App\Models\{Thing};
use App\Services\{Thing}Service;
use Illuminate\Http\Request;

class {Thing}Controller extends Controller
{
    public function __construct(private {Thing}Service $service)
    {
    }

    // GET /api/{things}?search=&status=&per_page=10
    public function index(Request $request)
    {
        $items = {Thing}::query()
            ->when($request->search, fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%")))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('code')
            ->paginate($request->integer('per_page', 10));

        return {Thing}Resource::collection($items);
    }

    public function store(Store{Thing}Request $request)
    {
        $thing = $this->service->create($request->validated());

        return (new {Thing}Resource($thing))
            ->additional(['message' => '{THING_LABEL} created.'])
            ->response()->setStatusCode(201);
    }

    // The variable name MUST match the route segment {{thing}} for route-model binding
    public function show({Thing} ${thing})
    {
        return new {Thing}Resource(${thing});
    }

    public function update(Update{Thing}Request $request, {Thing} ${thing})
    {
        ${thing}->update($request->validated());

        return (new {Thing}Resource(${thing}))->additional(['message' => '{THING_LABEL} updated.']);
    }

    public function destroy({Thing} ${thing})
    {
        $this->service->remove(${thing});

        return response()->json(['message' => '{THING_LABEL} deleted.']);
    }
}
