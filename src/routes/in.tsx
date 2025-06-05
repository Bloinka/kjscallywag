import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/in')({
  component: Launch,
})

// Helper function to detect if the user is in an in-app browser
const isInAppBrowser = () => {
  const userAgent = window.navigator.userAgent.toLowerCase()

  // Check for common in-app browser indicators
  const isInFacebookApp =
    userAgent.includes('fban') || userAgent.includes('fbav')
  const isInInstagramApp = userAgent.includes('instagram')
  const isInLineApp = userAgent.includes('line')
  const isInLinkedInApp = userAgent.includes('linkedin')
  const isInWeChatApp = userAgent.includes('micromessenger')
  const isInWhatsAppApp = userAgent.includes('whatsapp')
  const isInTwitterApp =
    userAgent.includes('twitter') || userAgent.includes('x-twitter')

  // iOS in-app browser and QR scanner detection
  const isIOSDevice = /(iphone|ipod|ipad)/i.test(userAgent)
  const isIOSSafari =
    isIOSDevice &&
    /safari/i.test(userAgent) &&
    !userAgent.includes('crios') &&
    !userAgent.includes('fxios')
  const isIOSWebView =
    isIOSDevice && /applewebkit/i.test(userAgent) && !isIOSSafari

  // iOS QR scanner often opens in a special Safari view
  const isIOSQRScanner =
    isIOSDevice &&
    (/crios|firefox|edgios|opera|instagram|snapchat/i.test(userAgent) ||
      // Check for other iOS browsers that might be used by the QR scanner
      (userAgent.includes('safari') &&
        !userAgent.includes('chrome') &&
        !userAgent.includes('version')))

  // Android in-app browser detection
  const isAndroidWebView = userAgent.includes('wv')

  return (
    isInFacebookApp ||
    isInInstagramApp ||
    isInLineApp ||
    isInLinkedInApp ||
    isInWeChatApp ||
    isInWhatsAppApp ||
    isInTwitterApp ||
    isIOSWebView ||
    isIOSQRScanner ||
    isAndroidWebView
  )
}

function Launch() {
  const navigate = useNavigate()

  // Get current URL to create launch link
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  useEffect(() => {
    // Check if we're in an in-app browser
    const checkBrowser = () => {
      const inAppBrowserDetected = isInAppBrowser()

      // Redirect to root if not in an in-app browser
      if (!inAppBrowserDetected) {
        navigate({ to: '/' })
      }
    }

    checkBrowser()
  }, [navigate])

  // Create launch function that will open in device's default browser
  const launchInDefaultBrowser = () => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /(iphone|ipod|ipad)/i.test(userAgent)

    if (isIOSDevice) {
      // For iOS, try to use the special URL scheme that forces Safari to open
      // This approach works better with iOS QR scanner and other in-app browsers
      const targetUrl = encodeURIComponent(currentUrl)
      const safariUrl = `x-web-search://?${targetUrl}`

      try {
        // First attempt with the x-web-search protocol
        window.location.href = safariUrl

        // Set a fallback in case the special scheme doesn't work
        setTimeout(() => {
          window.location.href = currentUrl
        }, 500)
      } catch (e) {
        // Fallback to standard approach
        window.location.href = currentUrl
      }
    } else {
      // Standard approach for other platforms
      window.location.href = currentUrl
    }
  }

  // Only render content if in an in-app browser
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <h2 className="text-2xl mb-4">You're using an in-app browser</h2>
        <p className="mb-8">
          For the best experience, we recommend using your device's default
          browser
        </p>

        <button
          onClick={launchInDefaultBrowser}
          className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
        >
          Launch in Default Browser
        </button>
      </header>
    </div>
  )
}
