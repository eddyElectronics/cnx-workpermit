import liff from '@line/liff'
import { LINE_CONFIG } from './config'

export interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
  email?: string
}

class LiffService {
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      await liff.init({ liffId: LINE_CONFIG.liffId })
      this.initialized = true
      console.log('LIFF initialized successfully')
    } catch (error) {
      console.error('LIFF initialization failed:', error)
      throw error
    }
  }

  async login(): Promise<void> {
    if (!liff.isLoggedIn()) {
      liff.login()
    }
  }

  async logout(): Promise<void> {
    if (liff.isLoggedIn()) {
      liff.logout()
    }
  }

  isLoggedIn(): boolean {
    return liff.isLoggedIn()
  }

  async getProfile(): Promise<LiffProfile> {
    try {
      const profile = await liff.getProfile()
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      }
    } catch (error) {
      console.error('Failed to get profile:', error)
      throw error
    }
  }

  async getAccessToken(): Promise<string | null> {
    return liff.getAccessToken()
  }

  isInClient(): boolean {
    return liff.isInClient()
  }

  async closeWindow(): Promise<void> {
    liff.closeWindow()
  }

  async openExternalWindow(url: string, external = true): Promise<void> {
    liff.openWindow({
      url,
      external,
    })
  }
}

export const liffService = new LiffService()
