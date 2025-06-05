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
  console.log('Current URL:', currentUrl)

  // Detect iOS device once
  const userAgent =
    typeof window !== 'undefined'
      ? window.navigator.userAgent.toLowerCase()
      : ''
  const isIOSDevice = /(iphone|ipod|ipad)/i.test(userAgent)

  // Add a special meta tag approach for iOS to force out of in-app browsers
  useEffect(() => {
    if (isIOSDevice) {
      // Create a meta tag to attempt forcing Safari to open
      const metaTag = document.createElement('meta')
      metaTag.name = 'apple-itunes-app'
      metaTag.content =
        'app-id=305343404, app-argument=https://kjscallywag.netlify.app'
      document.head.appendChild(metaTag)

      // Log user agent for debugging
      console.log('iOS device detected with user agent:', userAgent)
    }
  }, [isIOSDevice, userAgent])

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
        //   navigate({ to: '/' })
      }
    }

    checkBrowser()
  }, [navigate, isIOSDevice, userAgent])

  // Enhanced function to try multiple methods to open in default browser
  const launchInDefaultBrowser = () => {
    // The absolute URL we want to open (not the current URL which may be the in-app version)
    const targetUrl = 'https://kjscallywag.netlify.app'

    if (isIOSDevice) {
      // For iOS, we need to try multiple approaches

      // 1. Try location.replace - more forceful than location.href
      try {
        window.location.replace(targetUrl)
      } catch (e) {
        console.error('Method 1 failed:', e)
      }

      // 2. Backup open approach
      setTimeout(() => {
        try {
          window.open(targetUrl, '_system')
        } catch (e) {
          console.error('Method 2 failed:', e)
        }
      }, 100)
    } else {
      // For non-iOS, simpler approach
      window.location.href = targetUrl
    }
  }

  // Render content for any iOS device or in-app browser
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        {isIOSDevice ? (
          <>
            <h2 className="text-2xl mb-4">iOS In-App Browser Detected</h2>
            <p className="mb-4">
              For the best experience, please open this site in Safari. We've
              provided multiple methods below - try each one until you find one
              that works.
            </p>
            <p className="mb-8 text-sm text-yellow-300">
              <strong>Tip:</strong> If you're using the iOS QR Code scanner, try
              holding your finger on the QR code until a menu appears, then
              choose "Open in Safari" directly.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl mb-4">You're using an in-app browser</h2>
            <p className="mb-8">
              For the best experience, we recommend using your device's default
              browser
            </p>
          </>
        )}

        {isIOSDevice ? (
          <>
            {/* For iOS, we offer multiple buttons with different approaches */}
            <button
              onClick={() =>
                window.open('https://kjscallywag.netlify.app', '_blank')
              }
              className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-green-600 transition mb-4"
            >
              Method 1: Open in Browser
            </button>

            <button
              onClick={() =>
                window.open('https://kjscallywag.netlify.app', '_system')
              }
              className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition mb-4"
            >
              Method 2: Open in Safari
            </button>

            <button
              onClick={launchInDefaultBrowser}
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition mb-4"
            >
              Method 3: Force Safari Open
            </button>

            <a
              href="https://kjscallywag.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition inline-block"
            >
              Method 4: Try Direct Link
            </a>
          </>
        ) : (
          <button
            onClick={launchInDefaultBrowser}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
          >
            Launch in Default Browser
          </button>
        )}
      </header>
    </div>
  )
}
