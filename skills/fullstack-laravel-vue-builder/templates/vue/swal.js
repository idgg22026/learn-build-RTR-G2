import Swal from 'sweetalert2'
// remove the next line if the app is single-language, and replace t('…') with plain text
import { t } from '@/i18n'

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
})

export function notifySuccess(message) {
  return toast.fire({ icon: 'success', title: message })
}

export function notifyError(message) {
  return Swal.fire({ icon: 'error', title: t('common.error'), text: message })
}

export async function confirmAction({ title, text, confirmText = t('common.yes') }) {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: t('common.cancel'),
    confirmButtonColor: '#dc3545',
  })
  return result.isConfirmed
}