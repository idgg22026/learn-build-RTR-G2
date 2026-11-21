# Step 11 — Rooms page (full CRUD UI)

## Goal
The **Rooms** page lists rooms with search, status filter, pagination, a quick status dropdown, and a modal to
add/edit. Validation errors from Laravel appear under each field.

## You will learn
- The **service file** pattern: one JS file per API resource
- A list page: `filters` → debounced reload → table → pagination from Laravel's `meta`
- A modal form component with `props` / `emits`, and 422 error mapping (`errors.field[0]`)
- SweetAlert2 toasts and confirm dialogs

## Files
| File | Action |
|---|---|
| `src/services/roomService.js` | Created manually |
| `src/utils/swal.js`, `src/utils/money.js` | Created manually |
| `src/components/rooms/RoomStatusBadge.vue` | Created manually |
| `src/components/rooms/RoomFormModal.vue` | Created manually |
| `src/pages/rooms/RoomListPage.vue` | Created manually |

## Do it

**`src/services/roomService.js`**
```js
import http from './http'

export const ROOM_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'owner_use', label: 'Owner use' },
]

export const roomService = {
  list: (params) => http.get('/rooms', { params }).then((res) => res.data),
  get: (id) => http.get(`/rooms/${id}`).then((res) => res.data.data),
  create: (data) => http.post('/rooms', data).then((res) => res.data),
  update: (id, data) => http.put(`/rooms/${id}`, data).then((res) => res.data),
  updateStatus: (id, status) => http.patch(`/rooms/${id}/status`, { status }).then((res) => res.data),
  remove: (id) => http.delete(`/rooms/${id}`).then((res) => res.data),
}
```

**`src/utils/swal.js`**
```js
import Swal from 'sweetalert2'

const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true })

export const notifySuccess = (message) => toast.fire({ icon: 'success', title: message })
export const notifyError = (message) => Swal.fire({ icon: 'error', title: 'Error', text: message })

export async function confirmAction({ title, text, confirmText = 'Yes' }) {
  const r = await Swal.fire({ icon: 'warning', title, text, showCancelButton: true, confirmButtonText: confirmText, confirmButtonColor: '#dc3545' })
  return r.isConfirmed
}
```

**`src/utils/money.js`**
```js
export const formatRiel = (v) => (v == null ? '-' : `៛${Math.round(Number(v)).toLocaleString('en-US')}`)
export const formatUsd = (v) => `$${Number(v || 0).toFixed(2)}`
```

**`RoomStatusBadge.vue`**
```vue
<template><span class="badge" :class="cls">{{ label }}</span></template>
<script setup>
import { computed } from 'vue'
import { ROOM_STATUSES } from '@/services/roomService'
const props = defineProps({ status: String })
const MAP = { available: 'badge-success', occupied: 'badge-primary', maintenance: 'badge-warning', owner_use: 'badge-secondary' }
const cls = computed(() => MAP[props.status] ?? 'badge-light')
const label = computed(() => ROOM_STATUSES.find((s) => s.value === props.status)?.label ?? props.status)
</script>
```

**`RoomFormModal.vue`** (script part — the template is a Bootstrap modal with `v-if="show"` and one
`form-group` per field, each with `:class="{ 'is-invalid': errors.room_number }"` and
`<div class="invalid-feedback">{{ errors.room_number?.[0] }}</div>`)
```js
const props = defineProps({ show: Boolean, room: { type: Object, default: null } })
const emit = defineEmits(['close', 'saved'])

const emptyForm = () => ({ room_number: '', floor: '', type: '', rent_price: '', status: 'available', description: '' })
const form = reactive(emptyForm())
const errors = ref({})
const saving = ref(false)
const isEdit = computed(() => !!props.room)

// Fill the form every time the modal opens
watch(() => props.show, (visible) => {
  if (!visible) return
  errors.value = {}
  Object.assign(form, emptyForm(), props.room ? { ...props.room, floor: props.room.floor ?? '' } : {})
})

async function submit() {
  saving.value = true
  errors.value = {}
  const payload = { ...form, floor: form.floor === '' ? null : form.floor }
  try {
    const res = isEdit.value ? await roomService.update(props.room.id, payload) : await roomService.create(payload)
    notifySuccess(res.message)
    emit('saved')
  } catch (e) {
    if (e.response?.status === 422) errors.value = e.response.data.errors ?? {}
    else notifyError(e.response?.data?.message ?? 'Could not save the room.')
  } finally {
    saving.value = false
  }
}
```

**`RoomListPage.vue`** (script part — the template is in the original file and in the Figma *03 · Rooms* frame)
```js
const rooms = ref([]), meta = ref(null), loading = ref(false), error = ref('')
const filters = reactive({ search: '', status: '', page: 1 })
const showModal = ref(false), editing = ref(null), busyId = ref(null)

async function load() {
  loading.value = true; error.value = ''
  try {
    const res = await roomService.list({ ...filters, per_page: 10 })
    rooms.value = res.data
    meta.value = res.meta
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Could not load rooms.'
  } finally { loading.value = false }
}

// Search waits 300 ms after typing stops; any filter change goes back to page 1
let timer
watch(() => [filters.search, filters.status], () => {
  clearTimeout(timer)
  timer = setTimeout(() => { filters.page = 1; load() }, 300)
})

const goToPage = (p) => { if (p >= 1 && p <= meta.value.last_page) { filters.page = p; load() } }
const openCreate = () => { editing.value = null; showModal.value = true }
const openEdit = (room) => { editing.value = room; showModal.value = true }
const onSaved = () => { showModal.value = false; load() }

async function changeStatus(room, status) {
  busyId.value = room.id
  try { await roomService.updateStatus(room.id, status); room.status = status; notifySuccess('Room status updated.') }
  catch (e) { notifyError(e.response?.data?.message) } finally { busyId.value = null }
}

async function deleteRoom(room) {
  if (!(await confirmAction({ title: `Delete room ${room.room_number}?`, text: 'This cannot be undone.' }))) return
  busyId.value = room.id
  try { await roomService.remove(room.id); notifySuccess('Room deleted.'); load() }
  catch (e) { notifyError(e.response?.data?.message) } finally { busyId.value = null }
}

onMounted(load)
```
Buttons use the permission helper: `v-if="$can('edit')"` for Add/Edit, `v-if="$can('owner')"` for Delete.

## Check
- Add `A101` → toast "Room created successfully." and it appears in the table.
- Add `A101` again → red text under *Room number*: "The room number has already been taken."
- Set A101 to *Occupied*, then Delete → error dialog "Cannot delete an occupied room."

## Practice
Add a **Room items** button that opens `RoomItemsModal.vue`, an editable list (name, quantity, condition, note)
saved with the API you built in step 7's practice. Add "Copy to other rooms" with a multi-select.

## Commit
```bash
git add . && git commit -m "Step 11: Rooms page with filters, pagination and form modal"
```
