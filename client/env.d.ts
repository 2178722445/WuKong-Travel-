/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.geojson' {
  const value: any
  export default value
}

interface ImportMetaEnv {
  readonly VITE_CESIUM_ION_TOKEN: string
  readonly VITE_API_TARGET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
