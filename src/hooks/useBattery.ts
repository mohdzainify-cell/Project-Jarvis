import { useEffect } from 'react'
import { useJarvisStore } from '@/store/jarvisStore'

export function useBattery() {
  const { setBattery } = useJarvisStore()

  useEffect(() => {
    const nav = navigator as any
    nav.getBattery?.().then((bat: any) => {
      const update = () =>
        setBattery({
          level:    Math.round(bat.level * 100),
          charging: bat.charging,
          timeRemaining: bat.charging
            ? Math.round(bat.chargingTime / 60)
            : Math.round(bat.dischargingTime / 60),
        })

      update()
      bat.addEventListener('levelchange',          update)
      bat.addEventListener('chargingchange',        update)
      bat.addEventListener('chargingtimechange',    update)
      bat.addEventListener('dischargingtimechange', update)

      return () => {
        bat.removeEventListener('levelchange',          update)
        bat.removeEventListener('chargingchange',        update)
        bat.removeEventListener('chargingtimechange',    update)
        bat.removeEventListener('dischargingtimechange', update)
      }
    })

    // Electron IPC
    if (window.jarvis) {
      window.jarvis.onBatteryUpdate((data: { charging: boolean; level?: number }) => {
        setBattery({ charging: data.charging })
      })
    }
  }, [setBattery])
}