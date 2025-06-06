import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// Define the Song type
type Song = {
  id: string // Unique identifier (title + artist)
  title: string
  artist: string
  favorite?: boolean
}

// Define the modal content type
type ModalContent = {
  song: Song | null
  isOpen: boolean
}

export const Route = createFileRoute('/')({
  component: App,
})

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    console.error('localStorage is not available:', e)
    return false
  }
}

function App() {
  // Enable/disable pagination - controls whether results are shown in pages (true) or all at once (false)
  // When set to false, all pagination UI and functionality is disabled
  // This can be toggled by the user through a button in the interface
  const [enablePagination] = useState(false)

  const [songs, setSongs] = useState<Array<Song>>([])
  const [filteredSongs, setFilteredSongs] = useState<Array<Song>>([])
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'artist' | 'title'>('artist')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [localStorageAvailable] = useState<boolean>(isLocalStorageAvailable())
  const [modal, setModal] = useState<ModalContent>({
    song: null,
    isOpen: false,
  })

  // Number of results per page - only used if pagination is enabled
  const resultsPerPage = 100

  // Load favorites from localStorage on component mount
  useEffect(() => {
    if (!localStorageAvailable) {
      console.warn('localStorage is not available, favorites will not persist')
      return
    }

    try {
      const savedFavorites = localStorage.getItem('karaokeFavorites')
      console.log('Loading favorites from localStorage:', savedFavorites)
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites)
        console.log('Parsed favorites:', parsedFavorites)
        setFavorites(parsedFavorites)

        // If we're showing only favorites, update filtered results immediately
        if (showOnlyFavorites && songs.length > 0) {
          const filtered = songs.filter((song) => parsedFavorites[song.id])
          setFilteredSongs(sortSongs(filtered))
        }
      }
    } catch (err) {
      console.error('Failed to load favorites from localStorage:', err)
    }
  }, [localStorageAvailable, songs.length, showOnlyFavorites])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!localStorageAvailable || Object.keys(favorites).length === 0) {
      return
    }

    try {
      console.log('Saving favorites to localStorage:', favorites)
      localStorage.setItem('karaokeFavorites', JSON.stringify(favorites))
      // Verify the save worked by reading it back
      const savedValue = localStorage.getItem('karaokeFavorites')
      console.log('Verified saved value:', savedValue)
    } catch (err) {
      console.error('Failed to save favorites to localStorage:', err)
    }
  }, [favorites, localStorageAvailable])

  // Fetch the song list on component mount
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/SongList.txt')

        if (!response.ok) {
          throw new Error(
            `Failed to fetch songs: ${response.status} ${response.statusText}`,
          )
        }

        const text = await response.text()
        const lines = text.split('\n').filter(Boolean) // Filter out empty lines

        // Skip the header line and parse the remaining lines
        const parsedSongs = lines.slice(1).map((line) => {
          const parts = line.split('|')
          // Ensure we have both title and artist or set defaults
          const title = parts[0]
            ? parts[0].replace(/^"(.*)"$/, '$1').trim()
            : 'Unknown Title'
          const artist = parts[1]
            ? parts[1].replace(/^"(.*)"$/, '$1').trim()
            : 'Unknown Artist'

          // Create a unique ID for the song
          const id = `${title}___${artist}`.toLowerCase().replace(/\s+/g, '_')

          return {
            id,
            title,
            artist,
          }
        })

        // Sort the songs by artist initially
        const sortedSongs = [...parsedSongs].sort((a, b) => {
          return (
            a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
          )
        })

        setSongs(sortedSongs)
        setFilteredSongs([]) // Start with empty results until search
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    fetchSongs()
  }, [])

  // Sort songs based on current sort setting
  const sortSongs = (songsToSort: Array<Song>) => {
    return [...songsToSort].sort((a, b) => {
      if (sortBy === 'artist') {
        return (
          a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
        )
      } else {
        return a.title.localeCompare(b.title)
      }
    })
  }

  // Filter songs based on query and favorites settings
  const handleSearch = (value: string) => {
    setQuery(value)
    // Reset to first page when search query changes, but only if pagination is enabled
    if (enablePagination) {
      setCurrentPage(1)
    }

    let filtered = [...songs]

    // If we have favorites and no query, or query less than 3 characters
    if (!value.trim() || value.trim().length < 3) {
      if (showOnlyFavorites) {
        // Only show favorites
        filtered = filtered.filter((song) => favorites[song.id])
      } else {
        // Empty search, no filters - don't show anything
        setFilteredSongs([])
        return
      }
    } else {
      // Apply text search filter if query is long enough
      const lowercaseQuery = value.toLowerCase()
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(lowercaseQuery) ||
          song.artist.toLowerCase().includes(lowercaseQuery),
      )

      // Apply favorites filter if enabled
      if (showOnlyFavorites) {
        filtered = filtered.filter((song) => favorites[song.id])
      }
    }

    setFilteredSongs(sortSongs(filtered))
  }

  // Toggle favorites filter
  const toggleFavoritesFilter = () => {
    // Toggle the state and trigger search filter
    const newShowOnlyFavorites = !showOnlyFavorites
    setShowOnlyFavorites(newShowOnlyFavorites)

    // Reset to first page, but only if pagination is enabled
    if (enablePagination) {
      setCurrentPage(1)
    }

    // If we're switching to show favorites and have no query text,
    // we need to make sure favorites are displayed regardless of search text
    if (newShowOnlyFavorites) {
      const filtered = [...songs].filter((song) => favorites[song.id])
      setFilteredSongs(sortSongs(filtered))
      handleSearch('') // Clear search to show all favorites
    } else {
      // Otherwise re-apply the search with the new favorites setting
      handleSearch(query)
    }
  }

  // Handle sort change
  const handleSortChange = (newSortBy: 'artist' | 'title') => {
    setSortBy(newSortBy)
    setFilteredSongs(sortSongs(filteredSongs))
  }

  // Open song detail modal
  const handleOpenModal = (song: Song) => {
    setModal({ song, isOpen: true })
  }

  // Close song detail modal
  const handleCloseModal = () => {
    setModal({ song: null, isOpen: false })
  }

  // Toggle favorite status for a song
  const toggleFavorite = (songId: string) => {
    // First get current favorites state
    const isFavorited = !!favorites[songId]

    // Create a new favorites object with the toggled state
    const newFavorites = { ...favorites }

    if (isFavorited) {
      // Remove favorite if it exists
      delete newFavorites[songId]
    } else {
      // Add favorite if it doesn't exist
      newFavorites[songId] = true
    }

    // Save new favorites to state
    setFavorites(newFavorites)

    // Immediately save to localStorage to ensure it persists
    if (localStorageAvailable) {
      try {
        localStorage.setItem('karaokeFavorites', JSON.stringify(newFavorites))
        console.log('Immediately saved favorites:', newFavorites)
      } catch (err) {
        console.error('Failed to immediately save favorites:', err)
      }
    }

    // Update the current song in modal if it's open
    if (modal.isOpen && modal.song && modal.song.id === songId) {
      setModal({
        song: {
          ...modal.song,
          favorite: !isFavorited,
        },
        isOpen: true,
      })
    }

    // Update filtered songs list immediately based on current view
    if (showOnlyFavorites) {
      // If we're showing favorites only, directly apply the filter with new favorites state
      const filtered = songs.filter((song) => {
        // Use the new favorites state we just calculated
        return songId === song.id ? !isFavorited : !!newFavorites[song.id]
      })
      setFilteredSongs(sortSongs(filtered))
    } else if (query.trim() && query.trim().length >= 3) {
      // If there's an active search query, reapply the search with our new favorites
      const lowercaseQuery = query.toLowerCase()
      const filtered = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(lowercaseQuery) ||
          song.artist.toLowerCase().includes(lowercaseQuery),
      )
      setFilteredSongs(sortSongs(filtered))
    }
  }

  return (
    <div className="text-center min-h-screen flex flex-col bg-[#530000] text-white max-w-[100vw] overflow-hidden">
      {/* Fixed Header Section - No side margins on mobile */}
      <header className="sticky top-0 z-10 bg- pt-8 pb-4 sm:px-4 px-0 shadow-md w-full">
        <div className="w-full sm:max-w-md mx-auto px-0">
          <h1 className="sm:text-3xl text-2xl font-bold">
            KJ Scallywag Karaoke
          </h1>
          <h2 className="sm:text-2xl text-xl font-bold mb-4">Song Search</h2>

          {isLoading && <p>Loading songs...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {!isLoading && !error && (
            <>
              <div className="relative mt-1 px-4 ">
                <input
                  className="w-full py-2 px-3 text-lg text-black bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#61dafb] pr-10"
                  placeholder="Search for a song or artist..."
                  value={query}
                  onChange={(event) => handleSearch(event.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => handleSearch('')}
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Controls Bar - Favorites Filter and Sort */}
              <div className="flex justify-between mt-4 px-4 sm:px-0">
                {/* Filter controls */}
                <div className="flex space-x-2">
                  {/* Pagination Toggle */}
                  {/* <button
                    type="button"
                    onClick={() => setEnablePagination((prev) => !prev)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center ${
                      enablePagination
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label={
                      enablePagination
                        ? 'Disable pagination'
                        : 'Enable pagination'
                    }
                    title={
                      enablePagination
                        ? 'Currently showing results in pages of 100 items'
                        : 'Currently showing all results at once'
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          enablePagination
                            ? 'M4 6h16M4 12h16m-7 6h7'
                            : 'M4 6h16M4 12h16M4 18h16'
                        }
                      />
                    </svg>
                    {enablePagination ? 'Pages: On' : 'Pages: Off'}
                  </button> */}

                  {/* Favorites Filter Button - Only show if there are favorites */}
                  {Object.keys(favorites).length > 0 && (
                    <button
                      type="button"
                      onClick={toggleFavoritesFilter}
                      className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center ${
                        showOnlyFavorites
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      aria-label={
                        showOnlyFavorites
                          ? 'Show all songs'
                          : 'Show only favorites'
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 mr-1 ${showOnlyFavorites ? 'text-gray-900' : 'text-yellow-500'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {showOnlyFavorites ? 'Show All' : 'Favorites Only'}
                    </button>
                  )}
                </div>

                {/* Sort Controls */}
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => handleSortChange('title')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                      sortBy === 'title'
                        ? 'bg-[#61dafb] text-black'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sort by Title
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('artist')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                      sortBy === 'artist'
                        ? 'bg-[#61dafb] text-black'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Sort by Artist
                  </button>
                </div>
              </div>

              {/* Results Table - Full width on mobile */}
              <div className="mt-8 overflow-x-auto bg-white text-black sm:rounded-lg shadow w-screen sm:w-auto sm:mx-0">
                {(query.trim().length < 3 && !showOnlyFavorites) ||
                filteredSongs.length === 0 ? (
                  <div className="sm:p-8 p-4 text-center text-gray-700">
                    <p className="mb-4">
                      For best results search portions of a song or artist, not
                      all entries are correctly spelled.
                    </p>
                    <p className="italic">
                      Example, if looking for "Tennessee Whiskey", try
                      "Tennessee" or "Whiskey".
                    </p>
                    {showOnlyFavorites && filteredSongs.length === 0 && (
                      <p className="mt-4 font-semibold">
                        No favorite songs yet. Click the star icon next to a
                        song to add it to favorites.
                      </p>
                    )}
                  </div>
                ) : (
                  <table
                    className="w-full divide-y divide-gray-200"
                    style={{
                      tableLayout: 'fixed',
                      width: '100%',
                      maxWidth: '100%',
                    }}
                  >
                    <colgroup>
                      <col width="10%" /> {/* Favorite column */}
                      <col width="50%" /> {/* Song title column */}
                      <col width="40%" /> {/* Artist column */}
                    </colgroup>
                    <thead className="bg-gray-100">
                      <tr>
                        <th
                          scope="col"
                          className="sm:px-2 px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: '10%' }}
                        >
                          Fave
                        </th>
                        <th
                          scope="col"
                          className="sm:px-6 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: '50%' }}
                        >
                          Song Title{sortBy === 'title' && '(sorted)'}
                        </th>
                        <th
                          scope="col"
                          className="sm:px-6 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: '40%' }}
                        >
                          Artist {sortBy === 'artist' && '(sorted)'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(enablePagination
                        ? filteredSongs.slice(
                            (currentPage - 1) * resultsPerPage,
                            currentPage * resultsPerPage,
                          )
                        : filteredSongs
                      ).map((song, index) => (
                        <tr
                          key={index}
                          className={`${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleOpenModal(song)}
                        >
                          <td
                            className="sm:px-2 px-1 py-4 text-center"
                            style={{ width: '10%' }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation() // Prevent opening modal
                                toggleFavorite(song.id)
                              }}
                              className="focus:outline-none"
                              aria-label={
                                favorites[song.id]
                                  ? 'Remove from favorites'
                                  : 'Add to favorites'
                              }
                            >
                              {favorites[song.id] ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-yellow-500"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400 hover:text-yellow-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td
                            className="sm:px-6 px-2 py-4 text-base font-medium text-gray-900 overflow-hidden break-words"
                            style={{ width: '50%' }}
                          >
                            {song.title}
                          </td>
                          <td
                            className="sm:px-6 px-2 py-4 text-base text-gray-500 overflow-hidden break-words"
                            style={{ width: '40%' }}
                          >
                            {song.artist}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Information message for when pagination is disabled */}
                {!enablePagination && filteredSongs.length > 100 && (
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 text-center text-sm">
                    <p>
                      Showing all {filteredSongs.length} results. Enable
                      pagination for better performance.
                    </p>
                  </div>
                )}

                {/* Pagination Controls - Only show when pagination is enabled, and we have search results or showing favorites */}
                {enablePagination && filteredSongs.length > 0 && (
                  <div className="sm:px-6 px-4 py-3 bg-gray-100 w-full">
                    {/* Results count - Now on its own row */}
                    <div className="text-sm text-gray-500 pb-2 border-b border-gray-200 mb-2 text-center">
                      Showing{' '}
                      {Math.min(
                        resultsPerPage,
                        filteredSongs.length -
                          (currentPage - 1) * resultsPerPage,
                      )}{' '}
                      of {filteredSongs.length}{' '}
                      {showOnlyFavorites ? (
                        <span className="font-medium text-yellow-600">
                          favorite
                        </span>
                      ) : (
                        ''
                      )}{' '}
                      {query.trim() && query.trim().length >= 3 ? (
                        <span>
                          matching{' '}
                          <span className="font-medium">"{query}"</span>
                        </span>
                      ) : (
                        ''
                      )}{' '}
                      results
                    </div>

                    {/* Pagination buttons in their own row */}
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${
                          currentPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#61dafb] text-black hover:bg-[#43b9da]'
                        }`}
                      >
                        Previous
                      </button>

                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of{' '}
                        {Math.max(
                          1,
                          Math.ceil(filteredSongs.length / resultsPerPage),
                        )}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.ceil(filteredSongs.length / resultsPerPage),
                            ),
                          )
                        }
                        disabled={
                          currentPage >=
                          Math.ceil(filteredSongs.length / resultsPerPage)
                        }
                        className={`px-3 py-1 rounded ${
                          currentPage >=
                          Math.ceil(filteredSongs.length / resultsPerPage)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#61dafb] text-black hover:bg-[#43b9da]'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Song Detail Modal */}
              {modal.isOpen && modal.song && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Song Details
                      </h3>
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <p className="text-lg font-bold break-words text-black">
                        {modal.song.title}
                      </p>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Artist
                      </label>
                      <p className="text-lg break-words text-black">
                        {modal.song.artist}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => toggleFavorite(modal.song!.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {favorites[modal.song.id] ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-yellow-300"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Remove from Favorites
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                            Add to Favorites
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Content Area (scrollable) */}
      <div className="flex-1 overflow-auto py-6 sm:px-4 px-0 w-full">
        <div className="w-full sm:max-w-md mx-auto">
          {!isLoading &&
            !error &&
            (filteredSongs.length > 0 ||
              (query.trim().length < 3 && !showOnlyFavorites)) && (
              <div className="mt-4">
                {/* Results already displayed in header section */}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
