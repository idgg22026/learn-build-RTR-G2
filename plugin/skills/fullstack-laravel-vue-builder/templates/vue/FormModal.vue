<!-- src/components/{things}/{Thing}FormModal.vue -->
<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,.45)" @click.self="close">
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content" @submit.prevent="submit">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEdit ? 'Edit {THING_LABEL}' : 'Add {THING_LABEL}' }}</h5>
          <button type="button" class="close" @click="close"><span>&times;</span></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Code <span class="text-danger">*</span></label>
            <input v-model.trim="form.code" class="form-control" :class="{ 'is-invalid': errors.code }" maxlength="20" />
            <div class="invalid-feedback">{{ errors.code?.[0] }}</div>
          </div>
          <div class="form-group">
            <label>Name <span class="text-danger">*</span></label>
            <input v-model.trim="form.name" class="form-control" :class="{ 'is-invalid': errors.name }" />
            <div class="invalid-feedback">{{ errors.name?.[0] }}</div>
          </div>
          <div class="form-group">
            <label>Price</label>
            <input v-model="form.price" type="number" min="0" step="0.01" class="form-control" :class="{ 'is-invalid': errors.price }" />
            <div class="invalid-feedback">{{ errors.price?.[0] }}</div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.status" class="form-control" :class="{ 'is-invalid': errors.status }">
              <option v-for="s in {THING}_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <div class="invalid-feedback">{{ errors.status?.[0] }}</div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-light" :disabled="saving" @click="close">Cancel</button>
          <button class="btn btn-primary" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner fa-spin mr-1"></i> Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { {thing}Service, {THING}_STATUSES } from '@/services/{thing}Service'
import { notifyError, notifySuccess } from '@/utils/swal'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }, // null = create
})
const emit = defineEmits(['close', 'saved'])

const emptyForm = () => ({ code: '', name: '', price: '', status: 'active' })
const form = reactive(emptyForm())
const errors = ref({})
const saving = ref(false)
const isEdit = computed(() => !!props.item)

// Fill the form every time the modal opens
watch(() => props.show, (visible) => {
  if (!visible) return
  errors.value = {}
  Object.assign(form, emptyForm(), props.item ? { ...props.item } : {})
})

function close() {
  if (!saving.value) emit('close')
}

async function submit() {
  saving.value = true
  errors.value = {}
  try {
    const res = isEdit.value ? await {thing}Service.update(props.item.id, form) : await {thing}Service.create(form)
    notifySuccess(res.message)
    emit('saved')
  } catch (e) {
    if (e.response?.status === 422) errors.value = e.response.data.errors ?? {}
    else notifyError(e.response?.data?.message ?? 'Could not save.')
  } finally {
    saving.value = false
  }
}
</script>
