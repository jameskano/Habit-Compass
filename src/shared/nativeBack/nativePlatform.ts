export const isNativeAndroidRuntime = async () => {
  const { Capacitor } = await import('@capacitor/core')

  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}
