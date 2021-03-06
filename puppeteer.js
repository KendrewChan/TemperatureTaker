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

        return {
            browser: browser,
            page: page,
        };
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
        const { browser, page } = await pageHandler.getPage();
        await pageHandler.nusLogin(page, id, pass);
        await pageHandler.submitTemp(page, temp);

        await browser.close();
        return page; // This is kinda redundant at this point since browser already closed
    },
    submitTempTime: async (page, temp, morning) => {
        if (morning) {
            await page.select("select[name=declFrequency]", "A");
        } else {
            await page.select("select[name=declFrequency]", "P");
        }
        await page.click("input[name=symptomsFlag][value=N]");
        await page.click("input[name=familySymptomsFlag][value=N]");

        await page.type("input[name=temperature]", temp);

        await clickNavigate(page, "input[name=Save]");
    },
    scrapeTempTime: async (id, pass, temp, morning) => {
        const { browser, page } = await pageHandler.getPage();
        await pageHandler.nusLogin(page, id, pass);
        await pageHandler.submitTempTime(page, temp, morning);

        await browser.close();
        return page; // This is kinda redundant at this point since browser already closed
    },
};

module.exports = pageHandler;
