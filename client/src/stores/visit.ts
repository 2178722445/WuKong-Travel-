import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'wukong-shanxi-current-location'

export const useVisitStore = defineStore('visit', () => {
  const selectedLocationId = ref<number | null>(Number(localStorage.getItem(KEY)) || null)

  function selectLocation(id: number | null) {
    selectedLocationId.value = id
    if (id === null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(id))
  }

  return { selectedLocationId, selectLocation }
})
