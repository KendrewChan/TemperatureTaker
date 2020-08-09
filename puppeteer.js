const puppeteer = require("puppeteer-extra");

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Change this to open / close browser
const closeBrowser = true;

async function clickNavigate(page, selector) {
  await Promise.all([
    page.waitForNavigation(), // The promise resolves after navigation has finished
    page.click(selector), // Clicking the link will indirectly cause a navigation
  ]);
}

const pageHandler = {
  getPage: async () => {
    const browser = await puppeteer.launch({
      headless: closeBrowser,
      args: [
        "--no-sandbox",
        // "--disable-setuid-sandbox",
        // "--disable-dev-shm-usage",
      ],
    });
    const page = await browser.newPage();
    await page.goto("https://myaces.nus.edu.sg/htd");

    return page;
  },
  nusLogin: async (page, id, pass) => {
    await page.type("input[type=email]", id);
    await page.type("input[type=password]", pass);

    await clickNavigate(page, "#submitButton");
  },
  submitTemp: async (page, temp) => {
    await page.click("input[name=symptomsFlag][value=N]");
    await page.click("input[name=familySymptomsFlag][value=N]");

    await page.type("input[name=temperature]", temp);

    await clickNavigate(page, "input[name=Save]");
  },
  scrapeData: async (id, pass, temp) => {
    const page = await pageHandler.getPage();
    await pageHandler.nusLogin(page, id, pass);
    await pageHandler.submitTemp(page, temp);

    return page;
  },
};

module.exports = pageHandler;
