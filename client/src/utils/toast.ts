import { ref } from 'vue'

const toastRef = ref<any>(null)

export function setToast(ref: any) {
  toastRef.value = ref
}

export function useToast() {
  return {
    success(msg: string) { toastRef.value?.show(msg, 'success') },
    error(msg: string)   { toastRef.value?.show(msg, 'error') },
    warning(msg: string) { toastRef.value?.show(msg, 'warning') },
    info(msg: string)    { toastRef.value?.show(msg, 'info') },
  }
}
