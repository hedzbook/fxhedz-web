export {}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
    __HAS_NATIVE_TOKEN__?: boolean
    __NATIVE_EMAIL__?: string
  }
}