// src/services/{thing}Service.js: one file per API resource; pages never call axios directly
import http from './http'

export const {THING}_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const {thing}Service = {
  list: (params) => http.get('/{things}', { params }).then((res) => res.data), // { data, meta, links }
  get: (id) => http.get(`/{things}/${id}`).then((res) => res.data.data),
  create: (data) => http.post('/{things}', data).then((res) => res.data),     // { data, message }
  update: (id, data) => http.put(`/{things}/${id}`, data).then((res) => res.data),
  remove: (id) => http.delete(`/{things}/${id}`).then((res) => res.data),
}

// With files: send FormData, and for updates POST + _method=PUT (PHP cannot read multipart PUT)
// export function toFormData(data, method = null) { ... see RTR tenantService.js ... }
