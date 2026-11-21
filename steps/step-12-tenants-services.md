# Step 12 — Tenants, file uploads and the Service layer

## Goal
Add, edit and move out tenants with a **photo**, **ID documents** and **co-occupants**. Moving a tenant in marks the
room occupied. Everything happens in one **database transaction**, and files are **private**.

## You will learn
- Why business rules go in `app/Services/*` and not in controllers
- `DB::transaction()` so a failure leaves no half-saved tenant
- Uploading files with `FormData` and storing them privately with **signed, expiring links**

## Files
| File | Action |
|---|---|
| migrations: `add_profile_fields_to_tenants_table`, `create_tenant_documents_table`, `create_tenant_occupants_table` | Generated, then edited |
| `app/Models/TenantDocument.php`, `TenantOccupant.php` | Generated, then edited |
| `app/Http/Requests/StoreTenantRequest.php`, `UpdateTenantRequest.php` | Generated, then edited |
| `app/Services/TenantService.php` | Created manually |
| `app/Support/PrivateFile.php`, `app/Http/Controllers/PrivateFileController.php` | Created manually |
| `app/Http/Controllers/TenantController.php`, `app/Http/Resources/TenantResource.php` | Generated, then edited |
| `src/services/tenantService.js`, `src/pages/tenants/TenantListPage.vue`, `src/components/tenants/TenantFormModal.vue` | Created manually |

## Do it

**Controller stays thin** (`TenantController::store`):
```php
public function __construct(private TenantService $tenantService) {}

public function store(StoreTenantRequest $request)
{
    $tenant = $this->tenantService->create(
        $request->safe()->except(['photo', 'documents', 'occupants']),
        $request->file('photo'),
        $request->file('documents', []),
        $request->validated('occupants'),
    );

    return (new TenantResource($tenant->load(['room', 'documents', 'occupants'])))
        ->additional(['message' => 'Tenant created successfully.'])
        ->response()->setStatusCode(201);
}
```

**`app/Services/TenantService.php`** (core of `create`)
```php
public function create(array $data, ?UploadedFile $photo = null, array $documents = [], ?array $occupants = null): Tenant
{
    return DB::transaction(function () use ($data, $photo, $documents, $occupants) {
        if (! empty($data['room_id'])) {
            $this->occupyRoom($data['room_id']);                   // room must be available → set occupied
            $data['move_in_date'] = $data['move_in_date'] ?? now()->toDateString();
        }
        $data['status'] = 'active';

        if ($photo) {
            $data['photo_path'] = PrivateFile::store($photo, 'tenants/photos');
        }

        $tenant = Tenant::create($data);
        $this->storeDocuments($tenant, $documents);
        $this->syncOccupants($tenant, $occupants);

        return $tenant;
    });
}

private function occupyRoom(int $roomId): void
{
    $room = Room::lockForUpdate()->find($roomId);             // two people cannot take the same room
    if (! $room || $room->status !== 'available') {
        throw ValidationException::withMessages(['room_id' => 'This room is not available.']);
    }
    $room->update(['status' => 'occupied']);
}
```

**`app/Support/PrivateFile.php`** — files live in `storage/app/private`; the API only gives links that expire:
```php
class PrivateFile
{
    public const DISK = 'local';
    public const LIFETIME_MINUTES = 120;

    public static function store(UploadedFile $file, string $folder): string
    {
        return $file->store($folder, self::DISK);
    }

    public static function url(?string $path, ?string $name = null): ?string
    {
        if (! $path) return null;
        $relative = URL::temporarySignedRoute('private-file', now()->addMinutes(self::LIFETIME_MINUTES),
            array_filter(['path' => $path, 'name' => $name]), absolute: false);
        return url($relative);
    }
}
```
Route (outside the login group — the signature *is* the permission):
```php
Route::get('files/{path}', PrivateFileController::class)->where('path', '.*')
    ->middleware(['signed:relative', 'throttle:120,1'])->name('private-file');
```
In `TenantResource`: `'photo_url' => PrivateFile::url($this->photo_path)`.

**Vue: send files with `FormData`** (`tenantService.js`)
```js
// Convert a plain object (with optional File values) to FormData
function toFormData(data, method = null) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (key === 'documents') {
      value.forEach((file) => formData.append('documents[]', file))
    } else if (key === 'occupants') {
      formData.append('occupants', JSON.stringify(value)) // Laravel decodes this back to an array
    } else if (value instanceof File) {
      formData.append(key, value)
    } else if (value !== undefined) {
      formData.append(key, value ?? '') // Laravel turns '' into null
    }
  }
  // PHP cannot read multipart PUT bodies, so updates are sent as POST + _method=PUT
  if (method) formData.append('_method', method)
  return formData
}

export const tenantService = {
  list: (params) => http.get('/tenants', { params }).then((res) => res.data),
  create: (data) => http.post('/tenants', toFormData(data)).then((res) => res.data),
  update: (id, data) => http.post(`/tenants/${id}`, toFormData(data, 'PUT')).then((res) => res.data),
  moveOut: (id, data) => http.patch(`/tenants/${id}/move-out`, data).then((res) => res.data),
}
```
In `StoreTenantRequest`, `prepareForValidation()` decodes the `occupants` JSON string back to an array, and the
photo rule is `'photo' => ['nullable', 'image', 'max:5120']` (5 MB).

## Check
- Add a tenant with a photo into room A101 → A101 becomes **Occupied**.
- Copy the `photo_url` from the Network tab, wait 2 hours (or change `LIFETIME_MINUTES` to 1) → the link returns **403**.
- Upload a 6 MB photo → 422 (validation `max:5120`).

## Practice
Write the `moveOut()` service method: set `move_out_date` and `status = moved_out`, set the room back to `available`
if no other active tenant, all in a transaction. Then show "Moved out" with `TenantStatusBadge.vue`.

## Commit
```bash
git add . && git commit -m "Step 12: tenants with private files, occupants and TenantService"
```
