import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '../api'
import type { Location, Review } from '../types'

export const useLocationStore = defineStore('locations', () => {
  const locations = ref<Location[]>([])
  const favorites = ref<number[]>([])
  const currentLocation = ref<Location | null>(null)
  const loading = ref(false)

  async function fetchLocations(params?: { city?: string; tag?: string; search?: string }) {
    loading.value = true
    try {
      const { data } = await http.get('/locations', { params })
      locations.value = data.locations
      favorites.value = data.favorites || []
    } finally {
      loading.value = false
    }
  }

  async function fetchLocation(id: number) {
    const { data } = await http.get(`/locations/${id}`)
    currentLocation.value = data
    return data
  }

  async function toggleFavorite(locationId: number) {
    const { data } = await http.post(`/favorites/${locationId}`)
    if (data.favorited) {
      favorites.value.push(locationId)
    } else {
      favorites.value = favorites.value.filter(id => id !== locationId)
    }
    return data.favorited
  }

  async function submitReview(locationId: number, rating: number, content: string) {
    const { data } = await http.post(`/reviews/${locationId}`, { rating, content })
    return data
  }

  return { locations, favorites, currentLocation, loading, fetchLocations, fetchLocation, toggleFavorite, submitReview }
})
