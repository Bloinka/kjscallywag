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
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#520000] text-white text-[calc(10px+2vmin)]">
        {isIOSDevice ? (
          <>
            <h2 className="text-2xl mb-4">KJ Scallywag Karaoke Song List.</h2>
            <p className="m-4">
              For the best experience, please open this site in Safari. If you
              used your Camera app to scan you can click on the button below, if
              you used the iOS QR Scanner then you should click on the icon in
              the lower right corner of the screen to open the site in Safari.
            </p>
          </>
        ) : (
          <>
            <p className="mb-8">
              For the best experience, we recommend using your device's default
              browser
            </p>
          </>
        )}

        {isIOSDevice ? (
          <>
            <a
              href="https://kjscallywag.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-black-600 transition inline-block"
            >
              Launch App
            </a>
          </>
        ) : (
          <>
            <button
              onClick={launchInDefaultBrowser}
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-black-600 transition"
            >
              Launch App
            </button>
          </>
        )}
      </header>
    </div>
  )
}
