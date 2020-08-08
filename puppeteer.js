const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

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
		const browser = await puppeteer.launch({ headless: closeBrowser });
		const page = await browser.newPage();
		await page.goto(
			"https://myaces.nus.edu.sg/htd"
		);
	
		return page;
	},
	nusLogin: async (page, id, pass) => {
		await page.type('input[type=email]', id);
		await page.type('input[type=password]', pass);
	
		await clickNavigate(page, '#submitButton');
	},
	submitTemp: async (page, temp) => {
		await page.click('input[name=symptomsFlag][value=N]');
		// familySymptomsFlag
		await page.click('input[name=familySymptomsFlag][value=N]');
		// Healthy range of temperatures x: 36.1 <= x <= 37.2
		// const ranRange =  Math.floor(Math.random()*10)/10;
		// const temp = 36.1 + ranRange; // This gives a temperature ranging from 36.1 to 37.1

		await page.type('input[name=temperature]', temp);
	
		await clickNavigate(page, 'input[name=Save]');
	},
	scrapeData: async (id, pass, temp) => {
		const page = await pageHandler.getPage();
		await pageHandler.nusLogin(page, id, pass);
		await pageHandler.submitTemp(page, temp);
	
		return page;
	}
}

module.exports = pageHandler;

