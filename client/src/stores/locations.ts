import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '../api'
import type { Location, Review } from '../types'
import { demoLocations } from '../data/demo'

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
    } catch {
      let list = demoLocations
      if (params?.city) list = list.filter(item => item.city === params.city)
      if (params?.tag) list = list.filter(item => item.tags.includes(params.tag!))
      if (params?.search) list = list.filter(item => item.name.includes(params.search!) || item.city.includes(params.search!))
      locations.value = list.map(item => ({ ...item }))
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
    try {
      const { data } = await http.post(`/favorites/${locationId}`)
      if (data.favorited) favorites.value.push(locationId)
      else favorites.value = favorites.value.filter(id => id !== locationId)
      return data.favorited
    } catch {
      const favorited = !favorites.value.includes(locationId)
      if (favorited) favorites.value.push(locationId)
      else favorites.value = favorites.value.filter(id => id !== locationId)
      return favorited
    }
  }

  async function submitReview(locationId: number, rating: number, content: string) {
    const { data } = await http.post(`/reviews/${locationId}`, { rating, content })
    return data
  }

  return { locations, favorites, currentLocation, loading, fetchLocations, fetchLocation, toggleFavorite, submitReview }
})
