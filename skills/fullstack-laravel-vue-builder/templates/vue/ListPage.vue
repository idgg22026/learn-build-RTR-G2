<!-- src/pages/{things}/{Thing}ListPage.vue -->
<template>
  <div class="content-header">
    <div class="container-fluid">
      <div class="row mb-2 align-items-center">
        <div class="col-sm-6"><h1 class="m-0">{THING_LABEL}s</h1></div>
        <div v-if="$can('edit')" class="col-sm-6 text-sm-right">
          <button class="btn btn-primary" @click="openCreate"><i class="fas fa-plus mr-1"></i> Add {THING_LABEL}</button>
        </div>
      </div>
    </div>
  </div>

  <section class="content">
    <div class="container-fluid">
      <div class="card">
        <div class="card-header">
          <div class="row">
            <div class="col-md-6 mb-2 mb-md-0">
              <input v-model="filters.search" type="search" class="form-control" placeholder="Search code or name..." />
            </div>
            <div class="col-md-3">
              <select v-model="filters.status" class="form-control">
                <option value="">All statuses</option>
                <option v-for="s in {THING}_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <div v-if="error" class="alert alert-danger m-3">{{ error }}</div>
          <table v-else class="table table-hover mb-0">
            <thead>
              <tr><th>Code</th><th>Name</th><th class="text-right">Price</th><th>Status</th><th class="text-right">Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td class="font-weight-bold">{{ item.code }}</td>
                <td>{{ item.name }}</td>
                <td class="text-right">${{ Number(item.price).toFixed(2) }}</td>
                <td><span class="badge" :class="item.status === 'active' ? 'badge-success' : 'badge-secondary'">{{ item.status }}</span></td>
                <td class="text-right text-nowrap">
                  <button v-if="$can('edit')" class="btn btn-sm btn-outline-primary mr-1" @click="openEdit(item)"><i class="fas fa-edit"></i></button>
                  <button v-if="$can('owner')" class="btn btn-sm btn-outline-danger" :disabled="busyId === item.id" @click="remove(item)"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
              <tr v-if="!loading && items.length === 0">
                <td colspan="5" class="text-center text-muted py-4">Nothing found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="meta" class="card-footer d-flex justify-content-between align-items-center">
          <small class="text-muted">Showing {{ meta.from ?? 0 }}–{{ meta.to ?? 0 }} of {{ meta.total }}</small>
          <ul class="pagination pagination-sm m-0">
            <li class="page-item" :class="{ disabled: meta.current_page === 1 }">
              <a class="page-link" href="#" @click.prevent="goToPage(meta.current_page - 1)">&laquo;</a>
            </li>
            <li v-for="p in meta.last_page" :key="p" class="page-item" :class="{ active: p === meta.current_page }">
              <a class="page-link" href="#" @click.prevent="goToPage(p)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{ disabled: meta.current_page === meta.last_page }">
              <a class="page-link" href="#" @click.prevent="goToPage(meta.current_page + 1)">&raquo;</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <{Thing}FormModal :show="showModal" :item="editing" @close="showModal = false" @saved="onSaved" />
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { {thing}Service, {THING}_STATUSES } from '@/services/{thing}Service'
import {Thing}FormModal from '@/components/{things}/{Thing}FormModal.vue'
import { confirmAction, notifyError, notifySuccess } from '@/utils/swal'

const items = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref('')
const busyId = ref(null)
const filters = reactive({ search: '', status: '', page: 1 })
const showModal = ref(false)
const editing = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await {thing}Service.list({ ...filters, per_page: 10 })
    items.value = res.data
    meta.value = res.meta
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Could not load the list.'
  } finally {
    loading.value = false
  }
}

// Wait 300 ms after typing; any filter change goes back to page 1
let timer
watch(() => [filters.search, filters.status], () => {
  clearTimeout(timer)
  timer = setTimeout(() => { filters.page = 1; load() }, 300)
})

function goToPage(p) {
  if (!meta.value || p < 1 || p > meta.value.last_page) return
  filters.page = p
  load()
}

function openCreate() { editing.value = null; showModal.value = true }
function openEdit(item) { editing.value = item; showModal.value = true }
function onSaved() { showModal.value = false; load() }

async function remove(item) {
  if (!(await confirmAction({ title: `Delete ${item.code}?`, text: 'This cannot be undone.' }))) return
  busyId.value = item.id
  try {
    const res = await {thing}Service.remove(item.id)
    notifySuccess(res.message)
    load()
  } catch (e) {
    notifyError(e.response?.data?.message ?? 'Could not delete.')
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>
