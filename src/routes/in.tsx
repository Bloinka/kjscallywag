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

  // iOS QR scanner often opens in a special Safari view that's hard to detect
  // We're being very liberal with detection to catch all possible cases
  const isIOSQRScanner =
    isIOSDevice &&
    // Detect any iOS browser or WebView - iOS QR scanner behavior is inconsistent
    (/crios|firefox|edgios|opera|instagram|snapchat/i.test(userAgent) ||
      // Safari with iOS QR scanner often has 'safari' but lacks certain other markers
      userAgent.includes('safari') ||
      // Default to true for iOS to prevent redirect in ambiguous cases
      true)

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

  // Detect iOS device once
  const userAgent =
    typeof window !== 'undefined'
      ? window.navigator.userAgent.toLowerCase()
      : ''
  const isIOSDevice = /(iphone|ipod|ipad)/i.test(userAgent)

  useEffect(() => {
    // Only redirect non-iOS devices that aren't in in-app browsers
    const checkBrowser = () => {
      // Skip detection and redirect for iOS devices - iOS QR scanner should always see this page
      if (isIOSDevice) {
        // Log for debugging
        console.log('iOS device detected - showing launch page')
        return
      }

      const inAppBrowserDetected = isInAppBrowser()

      // Debug info - you can remove this later
      console.log('User Agent:', userAgent)
      console.log('Is detected as in-app browser:', inAppBrowserDetected)

      // Only redirect non-iOS devices that aren't in in-app browsers
      if (!inAppBrowserDetected) {
        navigate({ to: '/' })
      }
    }

    checkBrowser()
  }, [navigate, isIOSDevice, userAgent])

  // Create launch function that will open in device's default browser
  const launchInDefaultBrowser = () => {
    // Use already declared userAgent and isIOSDevice from the component scope

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

  // Render content for any iOS device or in-app browser
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        {isIOSDevice ? (
          <h2 className="text-2xl mb-4">
            Continue in Safari for the best experience
          </h2>
        ) : (
          <h2 className="text-2xl mb-4">You're using an in-app browser</h2>
        )}

        <p className="mb-8">
          For the best experience, we recommend using your device's default
          browser
        </p>

        <button
          onClick={launchInDefaultBrowser}
          className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
        >
          {isIOSDevice ? 'Open in Safari' : 'Launch in Default Browser'}
        </button>
      </header>
    </div>
  )
}
