import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// Define the Song type
type Song = {
  title: string
  artist: string
}

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [songs, setSongs] = useState<Array<Song>>([])
  const [filteredSongs, setFilteredSongs] = useState<Array<Song>>([])
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy] = useState<'artist' | 'title'>('title')

  const resultsPerPage = 100

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
          return { title, artist }
        })

        setSongs(parsedSongs)
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

  // Filter songs based on query
  const handleSearch = (value: string) => {
    setQuery(value)
    // Reset to first page when search query changes
    setCurrentPage(1)

    // If empty query or less than 3 characters, don't show any results
    if (!value.trim() || value.trim().length < 3) {
      setFilteredSongs([])
      return
    }

    const lowercaseQuery = value.toLowerCase()
    const filtered = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowercaseQuery) ||
        song.artist.toLowerCase().includes(lowercaseQuery),
    )
    setFilteredSongs(sortSongs(filtered))
  }

  // Handle sort change
  // const handleSortChange = (newSortBy: 'artist' | 'title') => {
  //   setSortBy(newSortBy)
  //   setFilteredSongs(sortSongs(filteredSongs))
  // }

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        {/* Song Search Section */}
        <div className="w-full max-w-md mx-auto mt-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Song/Artist Search</h2>

          {isLoading && <p>Loading songs...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}

          {!isLoading && !error && (
            <>
              <div className="relative mt-1">
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
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

              {/* Sort Controls */}
              {/* <div className="flex justify-end mt-4">
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
              </div>  */}

              {/* Results Table */}
              <div className="mt-8 overflow-x-auto bg-white text-black rounded-lg shadow">
                {query.trim().length < 3 ? (
                  <div className="p-8 text-center text-gray-700">
                    <p className="mb-4">
                      For best results search portions of a song or artist, not
                      all entries are correctly spelled.
                    </p>
                    <p className="italic">
                      Example, if looking for "Tennessee Whiskey", try
                      "Tennessee" or "Whiskey".
                    </p>
                  </div>
                ) : (
                  <table
                    className="w-full divide-y divide-gray-200"
                    style={{ tableLayout: 'fixed' }}
                  >
                    <colgroup>
                      <col width="60%" />
                      <col width="40%" />
                    </colgroup>
                    <thead className="bg-gray-100">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: '60%' }}
                        >
                          Song
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{ width: '40%' }}
                        >
                          Artist
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSongs
                        .slice(
                          (currentPage - 1) * resultsPerPage,
                          currentPage * resultsPerPage,
                        )
                        .map((song, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }
                          >
                            <td
                              className="px-6 py-4 text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{ maxWidth: 0 }}
                            >
                              {song.title}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap"
                              style={{ maxWidth: 0 }}
                            >
                              {song.artist}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                {/* Pagination Controls - Only show when we have search results */}
                {query.trim().length >= 3 && filteredSongs.length > 0 && (
                  <div className="px-6 py-3 bg-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing{' '}
                      {Math.min(
                        resultsPerPage,
                        filteredSongs.length -
                          (currentPage - 1) * resultsPerPage,
                      )}{' '}
                      of {filteredSongs.length} results
                    </div>

                    <div className="flex space-x-2">
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
            </>
          )}
        </div>
      </header>
    </div>
  )
}
