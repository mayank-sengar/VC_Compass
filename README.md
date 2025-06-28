# VC Matcher Agent

This project is a Node.js tool that helps match startup pitches with relevant venture capital (VC) investors. It uses web scraping, CSV parsing, and the Alchemyst AI API to analyze both the pitch and investor profiles, providing a match analysis for each VC.

## Features
- **Scrapes VC profiles** from OpenVC and Signal NFX.
- **Parses VC lists** from a CSV file.
- **Uses Alchemyst AI** to extract focus areas from a pitch and to evaluate VC-pitch fit.
- **Filters VCs** by relevant focus areas before matching.
- **Outputs results** to a JSON file for further review.

## Requirements
- Node.js (v16 or higher recommended)
- npm
- A valid Alchemyst API key (set in a `.env` file)

## Setup
1. **Clone the repository**
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Create a `.env` file** in the project root with your Alchemyst API key:
   ```env
   ALCHEMYST_API_KEY=your_api_key_here
   ```
4. **Prepare your input files:**
   - `sample_pitch.txt`: Your startup pitch (plain text)
   - `vc_list.csv`: List of VCs with columns: `name,bio,email,focus`

## Usage
Run the main script:
```sh
node index.js
```

- The script will:
  1. Extract focus areas from your pitch using Alchemyst AI
  2. Scrape VC profiles from OpenVC and Signal NFX
  3. Parse and filter VCs from your CSV by focus area
  4. Match each VC to your pitch using Alchemyst AI
  5. Save results to `vc_match_results.json`

## Output
- `vc_match_results.json`: Contains an array of VC objects with match analysis for each.

## Customization
- Edit the `openVCLinks` and `signalLinks` arrays in `index.js` to add/remove VC profiles to scrape.
- Update the CSV file path if needed.

## Troubleshooting
- **API errors:** Ensure your API key is valid and the Alchemyst API is reachable.
- **Scraping errors:** Make sure the profile URLs are correct and accessible.
- **CSV errors:** Ensure your CSV file is present and properly formatted.

## License
MIT
