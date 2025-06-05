// This script reads KaraFunSongListRaw.csv and creates a filtered SongList.txt file with only English songs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// File paths - adjust as needed
const inputFilePath = path.join(__dirname, 'src', 'KaraFunSongListRaw.csv') // Input from src folder
const outputFilePath = path.join(__dirname, 'public', 'SongList.txt') // Output to public folder

// Process the file when script runs
processKaraFunSongList()

function processKaraFunSongList() {
  try {
    // Read the input file
    const rawData = fs.readFileSync(inputFilePath, 'utf8')

    // CSV format uses semicolons as separators
    const rows = rawData.split('\n').map((row) => row.split(';'))

    // Extract headers (first row)
    const headers = rows[0]
    console.log('Headers:', headers)

    // Find the language column index dynamically
    const languageColumnIndex = headers.findIndex((header) =>
      header.toLowerCase().includes('language'),
    )

    if (languageColumnIndex === -1) {
      throw new Error('Could not find Languages column in CSV file')
    }

    console.log(`Language column found at index: ${languageColumnIndex}`)

    // Define which columns to keep - Title and Artist columns
    const titleIndex = 1 // Title is at index 1
    const artistIndex = 2 // Artist is at index 2
    const columnsToKeep = [titleIndex, artistIndex]

    // Count total rows and English songs
    const totalRows = rows.length - 1 // Excluding header
    let englishSongs = 0

    // Create new filtered data with only English songs
    const filteredData = rows
      .filter((row, index) => {
        // Keep header row
        if (index === 0) return true

        // Skip rows that don't have enough columns
        if (row.length <= languageColumnIndex) return false

        // Check if this row is for an English song
        const language = row[languageColumnIndex]
        const isEnglish = language && language.toLowerCase().includes('english')

        if (isEnglish) englishSongs++
        return isEnglish
      })
      .map((row) => {
        // Get the selected columns
        const selectedCols = columnsToKeep.map((colIndex) => {
          // Handle potential undefined columns
          return colIndex < row.length ? row[colIndex] || '' : ''
        })

        // Process Title - remove existing quotes and add new ones
        if (selectedCols[0]) {
          // Remove any existing quotes and add new ones for Title
          selectedCols[0] = `"${selectedCols[0].replace(/^"|"$/g, '').replace(/"/g, '""')}"`
        } else {
          selectedCols[0] = `""`
        }

        // Process Artist - remove existing quotes and add new ones
        if (selectedCols[1]) {
          // Remove any existing quotes and add new ones for Artist
          selectedCols[1] = `"${selectedCols[1].replace(/^"|"$/g, '').replace(/"/g, '""')}"`
        } else {
          selectedCols[1] = `""`
        }

        return selectedCols
      })

    // Convert back to pipe-delimited format
    const outputData = filteredData.map((row) => row.join('|')).join('\n')

    // Write to output file
    fs.writeFileSync(outputFilePath, outputData)

    console.log(`Processing complete:`)
    console.log(`- Total songs in input: ${totalRows}`)
    console.log(`- English songs filtered: ${englishSongs}`)
    console.log(`- Output file created: ${outputFilePath}`)
  } catch (error) {
    console.error('Error processing KaraFun song list:', error)
  }
}
