require('dotenv').config();
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

// Change this to open / close browser
const closeBrowser = false; 

async function getPage() {
	const browser = await puppeteer.launch({ headless: closeBrowser });
	const page = await browser.newPage();
	await page.goto(
		"https://myaces.nus.edu.sg/htd"
	);

	await nusLogin(page);

	await completeForm(page);
};

async function clickNavigate(page, selector) {
	await Promise.all([
		page.waitForNavigation(), // The promise resolves after navigation has finished
		page.click(selector), // Clicking the link will indirectly cause a navigation
	]);
}

async function nusLogin(page) {
	await page.type('input[type=email]', process.env.NETID);
	await page.type('input[type=password]', process.env.PASS);

	await clickNavigate(page, '#submitButton');
};

async function completeForm(page) {
	await page.click('input[name=symptomsFlag][value=N]');
	// familySymptomsFlag
	await page.click('input[name=familySymptomsFlag][value=N]');
	// Healthy range of temperatures x: 36.1 <= x <= 37.2
	const temp = 36.1 + Math.floor(Math.random()*10)/10; // This gives a temperature ranging from 36.1 to 37.1
	page.type('input[name=temperature]', temp.toString());

	await clickNavigate(page, 'input[name=Save]');
}

getPage();