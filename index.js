const puppeteer = require("puppeteer");

async function getEmail(browser) {
  const page = await browser.newPage();

  await page.goto("https://temp-mail.org/", {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  let email_id = "#mail";
  try {
    await page.waitForSelector(email_id);
    await page.waitForFunction(
      (email_id) => document.querySelector(email_id).value.indexOf("@") != -1,
      {},
      email_id
    );

    let email = await page.$eval(email_id, (el) => el.value);
    return email;
  } catch (e) {
    return false;
  }
}

async function main() {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--window-size=1000,800",
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    headless: false,
  });

  const email = await getEmail(browser); // getting the email
  if (email === false) {
    // error while getting email
    console.log("error while getting email");
    return; // close the program
  }
  console.log(email);
  /* Got email */

  browser.close();
}

main();
