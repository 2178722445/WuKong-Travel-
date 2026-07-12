export interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: string
  createdAt?: string
}

export interface Location {
  id: number
  name: string
  city: string
  district: string
  lng: number
  lat: number
  tags: string[]
  period: string
  description: string
  ticket: string
  hours: string
  bestSeason: string
  highlight: string
  images: string[]
  viewCount: number
  isFavorited?: boolean
  reviews?: Review[]
}

export interface Review {
  id: number
  userId: number
  locationId: number
  rating: number
  content: string
  images: string[]
  createdAt: string
  user: { id: number; username: string; avatar: string }
}

export interface Itinerary {
  id: number
  userId: number
  name: string
  startDate: string
  endDate: string
  createdAt: string
  days: ItineraryDay[]
}

export interface ItineraryDay {
  id: number
  itineraryId: number
  dayNumber: number
  locationIds: number[]
  note: string
}

export interface DashboardStats {
  userCount: number
  locationCount: number
  reviewCount: number
  itineraryCount: number
  topLocations: { id: number; name: string; city: string; viewCount: number }[]
  recentUsers: { id: number; username: string; createdAt: string }[]
}
