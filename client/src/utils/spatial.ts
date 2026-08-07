import {
  point as turfPoint,
  distance as turfDistance,
  buffer as turfBuffer,
  bbox as turfBbox,
  bboxPolygon as turfBboxPolygon,
  circle as turfCircle,
  pointsWithinPolygon,
  nearestPoint,
  lineString as turfLineString,
  length as turfLength,
  along as turfAlong,
  midpoint as turfMidpoint,
  transformScale,
  pointToLineDistance,
  convertLength,
  convertArea,
  booleanPointInPolygon,
  featureCollection,
  coordEach,
  centroid,
  envelope,
} from '@turf/turf'
import type { Feature, Point, Polygon, LineString, FeatureCollection, GeoJsonProperties } from 'geojson'

export interface LocationFeature {
  id: number
  name: string
  lng: number
  lat: number
  properties?: GeoJsonProperties
}

export function locationsToGeoJSON(locations: LocationFeature[]): FeatureCollection<Point> {
  return featureCollection(
    locations.map(loc => turfPoint([loc.lng, loc.lat], { id: loc.id, name: loc.name, ...loc.properties }))
  )
}

export function distanceBetween(lng1: number, lat1: number, lng2: number, lat2: number): number {
  return turfDistance(turfPoint([lng1, lat1]), turfPoint([lng2, lat2]), { units: 'meters' })
}

export function createBuffer(lng: number, lat: number, radiusMeters: number): Feature<Polygon> {
  return turfCircle([lng, lat], radiusMeters / 1000, { steps: 64, units: 'kilometers' })
}

export function findPointsInBuffer(
  lng: number,
  lat: number,
  radiusMeters: number,
  locations: LocationFeature[]
): LocationFeature[] {
  const buffer = createBuffer(lng, lat, radiusMeters)
  const points = featureCollection(locations.map(l => turfPoint([l.lng, l.lat], { id: l.id, name: l.name })))
  return pointsWithinPolygon(points, buffer).features.map(f => {
    const props = f.properties || {}
    return {
      id: props.id as number,
      name: props.name as string,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      distance: distanceBetween(lng, lat, f.geometry.coordinates[0], f.geometry.coordinates[1]),
    } as LocationFeature & { distance: number }
  }).sort((a, b) => a.distance - b.distance)
}

export function computeOptimalPath(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  waypoints: LocationFeature[]
): Feature<LineString> {
  const coords: [number, number][] = [[startLng, startLat]]
  let remaining = [...waypoints]
  while (remaining.length > 0) {
    const current = coords[coords.length - 1]
    const nearest = nearestPoint(turfPoint(current), featureCollection(remaining.map(w => turfPoint([w.lng, w.lat], { name: w.name, id: w.id }))))
    const idx = remaining.findIndex(w => w.lng === nearest.geometry.coordinates[0] && w.lat === nearest.geometry.coordinates[1])
    if (idx >= 0) {
      coords.push([remaining[idx].lng, remaining[idx].lat])
      remaining.splice(idx, 1)
    } else {
      break
    }
  }
  coords.push([endLng, endLat])
  return turfLineString(coords)
}

export function computeRouteLength(line: Feature<LineString>): { meters: number; kilometers: number } {
  const meters = turfLength(line, { units: 'meters' })
  return { meters: Math.round(meters), kilometers: Math.round(meters / 100) / 10 }
}

export function projectCoordinate(
  lng: number,
  lat: number,
  fromEPSG: number = 4326,
  toEPSG: number = 3857
): [number, number] {
  if (fromEPSG === 4326 && toEPSG === 3857) {
    const x = (lng * 20037508.34) / 180
    const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
    const mercatorY = (y * 20037508.34) / 180
    return [x, Math.max(-20037508.34, Math.min(20037508.34, mercatorY))]
  }
  if (fromEPSG === 3857 && toEPSG === 4326) {
    const x = (lng / 20037508.34) * 180
    const y = (lat / 20037508.34) * 180
    const wgsLat = (Math.atan(Math.exp((y * Math.PI) / 180)) * 360) / Math.PI - 90
    return [x, wgsLat]
  }
  return [lng, lat]
}
