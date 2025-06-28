require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const alchemystAPI = axios.create({
  baseURL: "https://api.alchemyst.ai",
  headers: {
    Authorization: `Bearer ${process.env.ALCHEMYST_API_KEY}`,
    "Content-Type": "application/json",
  },
});

//scrapping vc bio from OpenVC
async function scrapeVCFromOpenVC(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const name = $('h1').text().trim();
  const bio = $('section p').first().text().trim();
  const contact = $('a[href^="mailto:"]').attr('href')?.replace('mailto:', '');
  return { name, bio, contact, source: "OpenVC" };
}

//scrapping signal NFX vc profile
async function scrapeFromSignal(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const data = await page.evaluate(() => {
    const name = document.querySelector("h1")?.innerText;
    const bio = document.querySelector(".bio")?.innerText || "No bio available";
    const contact = Array.from(document.querySelectorAll("a"))
      .map(a => a.href)
      .find(link => link.startsWith("mailto:"))?.replace("mailto:", "");
    return { name, bio, contact };
  });

  await browser.close();
  return { ...data, source: "Signal NFX" };
}

//parsing vc list from csv file
function parseVCListFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

//extracting pitch domain using Alchemyst
async function extractFocusArea(pitchText) {
  const prompt = `Given the following startup pitch, identify the primary domains or sectors it belongs to (e.g., AI, Climate, SaaS, HealthTech):\n\n"${pitchText}"\n\nReturn a comma-separated list.`;
  const response = await alchemystAPI.post("/api/v1/chat", {
    prompt
  });
  return response.data?.text?.toLowerCase().split(",").map(f => f.trim()) || [];
}

//matching pitch with vc using alcemyst
async function matchPitchToVC(pitchText, vcData) {
  const prompt = `Given the startup pitch: "${pitchText}", evaluate if the following investor is a good match:\n\nName: ${vcData.name}\nBio: ${vcData.bio || vcData.description || "No bio available."}\nFocus: ${vcData.focus || "Unknown"}\n\nRespond with a YES/NO and explain.`;

  const response = await alchemystAPI.post("/api/v1/chat", {
    prompt
  });

  return {
    ...vcData,
    matchAnalysis: response.data,
  };
}


(async () => {
  try {
    const pitchText = fs.readFileSync("./sample_pitch.txt", "utf-8");

    //1 Detecting relevant domains
    const focusAreas = await extractFocusArea(pitchText);
    console.log("Focus areas detected:", focusAreas.join(", "));

    const openVCLinks = [
      "https://www.openvc.app/investor/sarah-guo"
    ];
    const signalLinks = [
      "https://signal.nfx.com/investor/aaron-harris" // Real Signal NFX profile
    ];
    const csvPath = path.resolve(__dirname, "vc_list_enriched.csv");

    const results = [];

    // 2 scrapping from OpenVC
    for (const url of openVCLinks) {
      try {
        const openVCData = await scrapeVCFromOpenVC(url);
        const match = await matchPitchToVC(pitchText, openVCData);
        results.push(match);
      } catch (err) {
        console.error(`Error scraping OpenVC (${url}):`, err.message);
      }
    }

    //3 scrapping  from Signal NFX
    for (const url of signalLinks) {
      try {
        const signalData = await scrapeFromSignal(url);
        const match = await matchPitchToVC(pitchText, signalData);
        results.push(match);
      } catch (err) {
        console.error(`Error scraping Signal NFX (${url}):`, err.message);
      }
    }

    //4 filtering csv VCs by focus and match
    try {
      const vcList = await parseVCListFromCSV(csvPath);
      const filteredVCs = vcList.filter(vc => {
        const lowerFocus = vc.focus.toLowerCase();
        return focusAreas.some(focus => lowerFocus.includes(focus));
      });

      for (const vc of filteredVCs) {
        try {
          const match = await matchPitchToVC(pitchText, vc);
          results.push(match);
        } catch (err) {
          console.error(`Error matching VC from CSV (${vc.name}):`, err.message);
        }
      }
    } catch (err) {
      console.error("Error processing CSV VCs:", err.message);
    }

    fs.writeFileSync("vc_match_results.json", JSON.stringify(results, null, 2));
    console.log(" VC Matching complete. Check vc_match_results.json");
  } catch (err) {
    console.error("Fatal error in VC matching:", err.message);
  }
})();
