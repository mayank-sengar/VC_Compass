const puppeteer = require("puppeteer");

async function scrapeFromSignal(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const data = await page.evaluate(() => {
    const name = document.querySelector("h1")?.innerText;
    const bio = document.querySelector(".bio")?.innerText || "No bio available";
    const contact = Array.from(document.querySelectorAll("a"))
      .map((a) => a.href)
      .find((link) => link.startsWith("mailto:"))?.replace("mailto:", "");
    return { name, bio, contact };
  });

  await browser.close();
  return { ...data, source: "Signal NFX" };
}

module.exports = { scrapeFromSignal };
