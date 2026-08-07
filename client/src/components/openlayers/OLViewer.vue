<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import OSM from 'ol/source/OSM.js'
import XYZ from 'ol/source/XYZ.js'
import { fromLonLat, toLonLat, transform } from 'ol/proj.js'
import { defaults as defaultControls } from 'ol/control.js'
import { defaults as defaultInteractions } from 'ol/interaction.js'
import Feature from 'ol/Feature.js'
import Point from 'ol/geom/Point.js'
import LineString from 'ol/geom/LineString.js'
import Polygon from 'ol/geom/Polygon.js'
import Circle from 'ol/geom/Circle.js'
import { Style, Fill, Stroke, Circle as CircleStyle, Text, Icon } from 'ol/style.js'
import { buffer as extentBuffer } from 'ol/extent.js'
import Overlay from 'ol/Overlay.js'
import 'ol/ol.css'
import type { Location } from '../../types'

const props = defineProps<{
  locations: Location[]
  selectedLocationId: number | null
  routePath?: { lng: number; lat: number }[]
  bufferGeometry?: any
}>()

const emit = defineEmits<{
  (e: 'select-location', id: number): void
  (e: 'view-detail', id: number): void
}>()

const container = ref<HTMLDivElement>()
let map: Map
let markerLayer: VectorLayer<VectorSource>
let routeLayer: VectorLayer<VectorSource>
let bufferLayer: VectorLayer<VectorSource>
let popupOverlay: Overlay

const viewMode = ref<'2d' | 'satellite'>('2d')
const baseLayers = ref<any>({})

onMounted(() => {
  if (!container.value) return
  initMap()
  addMarkers()
})

onUnmounted(() => {
  map?.setTarget(undefined)
})

watch(() => props.locations, () => addMarkers(), { deep: true })
watch(() => props.selectedLocationId, (id) => {
  if (id !== null) flyTo(id)
})
watch(() => props.routePath, (path) => {
  routeLayer.getSource()?.clear()
  if (path && path.length > 0) drawRoute(path)
})
watch(() => props.bufferGeometry, (geom) => {
  bufferLayer.getSource()?.clear()
  if (geom) drawBuffer(geom)
})

function initMap() {
  const osmLayer = new TileLayer({ source: new OSM(), visible: true, zIndex: 0 })
  const satelliteLayer = new TileLayer({
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
    }),
    visible: false,
    zIndex: 0,
  })
  const labelLayer = new TileLayer({
    source: new XYZ({
      url: 'https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
      maxZoom: 19,
    }),
    visible: false,
    zIndex: 1,
  })

  markerLayer = new VectorLayer({ source: new VectorSource(), zIndex: 10 })
  routeLayer = new VectorLayer({ source: new VectorSource(), zIndex: 9 })
  bufferLayer = new VectorLayer({ source: new VectorSource(), zIndex: 8 })

  popupOverlay = new Overlay({
    element: document.createElement('div'),
    positioning: 'bottom-center',
    offset: [0, -15],
  })

  map = new Map({
    target: container.value,
    layers: [osmLayer, satelliteLayer, labelLayer, bufferLayer, routeLayer, markerLayer],
    overlays: [popupOverlay],
    view: new View({
      center: fromLonLat([112.0, 37.0]),
      zoom: 7,
      maxZoom: 18,
      minZoom: 5,
    }),
    controls: defaultControls({ attribution: false, zoom: false, rotate: false }),
    interactions: defaultInteractions({ doubleClickZoom: false }),
  })

  map.on('singleclick', (e) => {
    const feature = map.forEachFeatureAtPixel(e.pixel, (f) => f)
    if (feature) {
      const locId = feature.get('locationId')
      if (locId) emit('select-location', locId as number)
    }
  })
}

function getMarkerStyle(loc: Location, isSelected: boolean) {
  const isFav = loc.isFavorited
  const fillColor = isSelected ? '#ff4d4f' : (isFav ? '#ff4d4f' : '#d4a853')
  return new Style({
    image: new CircleStyle({
      radius: isSelected ? 16 : 12,
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: '#fff', width: 2.5 }),
    }),
    text: new Text({
      text: String(loc.id),
      font: `bold ${isSelected ? 15 : 13}px sans-serif`,
      fill: new Fill({ color: '#fff' }),
    }),
  })
}

function addMarkers() {
  const source = markerLayer.getSource()!
  source.clear()
  props.locations.forEach((loc) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([loc.lng, loc.lat])),
      locationId: loc.id,
      name: loc.name,
    })
    feature.setStyle(getMarkerStyle(loc, props.selectedLocationId === loc.id))
    source.addFeature(feature)
  })
  if (props.locations.length > 0) {
    const extent = source.getExtent()
    map.getView().fit(extentBuffer(extent, 50000))
  }
}

function flyTo(locationId: number) {
  const loc = props.locations.find(l => l.id === locationId)
  if (!loc) return
  map.getView().animate({ center: fromLonLat([loc.lng, loc.lat]), zoom: 13, duration: 800 })
  const source = markerLayer.getSource()!
  source.getFeatures().forEach(f => {
    const id = f.get('locationId')
    if (id === locationId) {
      const l = props.locations.find(l => l.id === id)
      if (l) f.setStyle(getMarkerStyle(l, true))
    }
  })
}

function drawRoute(path: { lng: number; lat: number }[]) {
  routeLayer.getSource()?.clear()
  const coords = path.map(p => fromLonLat([p.lng, p.lat]))
  const feature = new Feature({
    geometry: new LineString(coords),
  })
  feature.setStyle(new Style({
    stroke: new Stroke({ color: '#1677ff', width: 4, lineDash: [10, 6] }),
  }))
  routeLayer.getSource()?.addFeature(feature)

  path.forEach((p, i) => {
    const marker = new Feature({
      geometry: new Point(fromLonLat([p.lng, p.lat])),
    })
    marker.setStyle(new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#1677ff' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: new Text({
        text: String(i + 1),
        font: 'bold 11px sans-serif',
        fill: new Fill({ color: '#fff' }),
      }),
    }))
    routeLayer.getSource()?.addFeature(marker)
  })

  const extent = routeLayer.getSource()!.getExtent()
  map.getView().fit(extentBuffer(extent, 80000))
}

function drawBuffer(geom: any) {
  bufferLayer.getSource()?.clear()
  const coords = geom.coordinates[0].map((c: number[]) => fromLonLat(c))
  const feature = new Feature({
    geometry: new Polygon([coords]),
  })
  feature.setStyle(new Style({
    fill: new Fill({ color: 'rgba(22, 119, 255, 0.1)' }),
    stroke: new Stroke({ color: '#1677ff', width: 2 }),
  }))
  bufferLayer.getSource()?.addFeature(feature)
}

defineExpose({ map })
</script>

<template>
  <div class="ol-container">
    <div ref="container" class="ol-map"></div>
  </div>
</template>

<style scoped>
.ol-container {
  width: 100%;
  height: 100%;
  position: relative;
}
.ol-map {
  width: 100%;
  height: 100%;
}
</style>
