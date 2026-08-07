<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { Location } from '../../types'

const props = defineProps<{
  locations: Location[]
  selectedLocationId: number | null
}>()

const emit = defineEmits<{
  (e: 'select-location', id: number): void
  (e: 'view-detail', id: number): void
}>()

const container = ref<HTMLDivElement>()
const viewer = shallowRef<Cesium.Viewer>()

onMounted(() => {
  if (!container.value) return
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN
  if (ionToken) {
    Cesium.Ion.defaultAccessToken = ionToken
  }

  viewer.value = new Cesium.Viewer(container.value, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    homeButton: false,
    geocoder: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    selectionIndicator: false,
    infoBox: false,
    terrainProvider: ionToken
      ? Cesium.createWorldTerrain()
      : new Cesium.EllipsoidTerrainProvider(),
  })

  viewer.value.scene.globe.enableLighting = true
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(112.0, 37.0, 200000),
  })

  addMarkers()
})

onUnmounted(() => {
  viewer.value?.destroy()
})

watch(() => props.locations, addMarkers, { deep: true })
watch(() => props.selectedLocationId, (id) => {
  if (id !== null) flyTo(id)
})

function addMarkers() {
  if (!viewer.value) return
  viewer.value.entities.removeAll()
  props.locations.forEach((loc) => {
    const isFav = loc.isFavorited
    const color = isFav ? Cesium.Color.fromCssColorString('#ff4d4f') : Cesium.Color.fromCssColorString('#d4a853')
    viewer.value!.entities.add({
      id: `loc-${loc.id}`,
      position: Cesium.Cartesian3.fromDegrees(loc.lng, loc.lat, 800),
      billboard: {
        image: createMarkerCanvas(loc.id, isFav),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 0.8,
      },
      label: {
        text: loc.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -50),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
      },
      properties: { locationId: loc.id },
    })
  })
  if (viewer.value.entities.values.length > 0) {
    viewer.value.zoomTo(viewer.value.entities)
  }
}

const markerCanvas = document.createElement('canvas')

function createMarkerCanvas(id: number, isFav: boolean): string {
  const size = 40
  markerCanvas.width = size + 8
  markerCanvas.height = size + 12
  const ctx = markerCanvas.getContext('2d')!
  ctx.clearRect(0, 0, size + 8, size + 12)

  ctx.beginPath()
  ctx.arc(size / 2 + 4, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = isFav ? '#ff4d4f' : '#d4a853'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(id), size / 2 + 4, size / 2)

  ctx.beginPath()
  ctx.moveTo(size / 2, size - 2)
  ctx.lineTo(size / 2 + 4, size + 10)
  ctx.lineTo(size / 2 + 8, size - 2)
  ctx.fillStyle = isFav ? '#ff4d4f' : '#d4a853'
  ctx.fill()

  return markerCanvas.toDataURL()
}

function flyTo(locationId: number) {
  const loc = props.locations.find(l => l.id === locationId)
  if (!loc || !viewer.value) return
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(loc.lng, loc.lat, 5000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 1.5,
  })
}

defineExpose({ viewer, flyTo })
</script>

<template>
  <div ref="container" class="cesium-viewer"></div>
</template>

<style scoped>
.cesium-viewer {
  width: 100%;
  height: 100%;
}
/* Hide Cesium credits for cleaner look */
.cesium-viewer :deep(.cesium-viewer-bottom) {
  display: none;
}
</style>
