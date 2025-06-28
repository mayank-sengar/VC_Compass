const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeVCFromOpenVC(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const name = $("h1").text().trim();
  const bio = $("section p").first().text().trim();
  const contact = $('a[href^="mailto:"]').attr("href")?.replace("mailto:", "");
  return { name, bio, contact, source: "OpenVC" };
}

module.exports = { scrapeVCFromOpenVC };
