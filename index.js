const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const uuid = require("uuid");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const { PuppeteerBlocker } = require("@cliqz/adblocker-puppeteer");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { fetch } = require("cross-fetch");

/* get config */
const config = require("./config.json");

async function getEmail(page) {
  PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });
  await page.bringToFront();
  await page.goto("https://temp-mail.org/en", {
    waitUntil: "networkidle2",
    timeout: 0,
  });
  var info_id = "#mail";

  try {
    await page.waitForSelector(info_id);
    await page.waitForFunction(
      (info_id) => document.querySelector(info_id).value.indexOf("@") != -1,
      {},
      info_id
    );

    var email = await page.$eval("#mail", (el) => el.value);
    return email;
  } catch (e) {
    return false;
  }
}

function createAccountInfo(email) {
  function getUsername() {
    // make random names from `names.txt`
    const names = fs.readFileSync("names.txt", "utf8");
    username =
      String(
        names.split("\n")[Math.floor(Math.random() * names.split("\n").length)]
      )
        .replace("\r", "")
        .toLowerCase()
        .replace(" ", "_") + String(Math.random() * 1000000).split(".")[0];

    return username;
  }

  // making account info
  const AccountInfo = {
    email: email,
    password: config.password,
    fullName: uuid.v4().replace("-", "").split("-")[0],
    username: getUsername(),
  };

  return AccountInfo;
}

async function FillAccountInfo(page, accountInfo) {
  async function dsne(page, infoname, info) {
    const p = await page.$("input[name=" + infoname + "]");
    await p.focus();
    await page.keyboard.type(info);
  }

  await page.bringToFront();
  await page.goto("https://www.instagram.com/accounts/emailsignup/", {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  // filling
  await page.waitForSelector("input[name=emailOrPhone]");

  await dsne(page, "emailOrPhone", accountInfo.email);
  await dsne(page, "fullName", accountInfo.fullName);
  await dsne(page, "username", accountInfo.username);
  await dsne(page, "password", accountInfo.password);

  // click sign up button
  const btnSignUp = await page.$("button[type=submit]");
  await btnSignUp.click();
}

function createBirthInfo() {
  const birthInfo = {
    month: String(Math.random() * 10).split(".")[0],
    day: String(Math.random() * 10).split(".")[0],
    year: "199" + String(Math.random() * 10).split(".")[0],
  };
  return birthInfo;
}

async function fillBirthInfo(page, birthinfo) {
  async function getElement(page, titleInfo) {
    const selector = `select[title="${titleInfo}"]`;
    await page.waitForSelector(selector);
    return selector;
  }

  const elMonth = await getElement(page, "Month:");
  await page.select(elMonth, birthinfo.month);

  const elDay = await getElement(page, "Day:");
  await page.select(elDay, birthinfo.day);

  const elYear = await getElement(page, "Year:");
  await page.select(elYear, birthinfo.year);

  // click next button
  const btnSignUp = await page.$(
    "#react-root > section > main > div > div > div:nth-child(1) > div > div.qF0y9.Igw0E.IwRSH.eGOV_.acqo5._4EzTm.lC6p0.g6RW6 > button"
  );
  await btnSignUp.click();
}

async function emailverify(page) {
  await page.bringToFront();

  while (true) {
    try {
      let content = null;
      await page.waitForSelector("[title*=Instagram ]", { timeout: 500 });

      // await page.waitForFunction(() => {
      //   return document
      //     .querySelector("[title*=Instagram ]")
      //     .parentElement.lastChild.textContent.indexOf("code");
      // });

      content = await page.evaluate(
        () =>
          document
            .querySelector("[title*=Instagram ]")
            .parentElement.parentNode.parentElement.querySelectorAll("a")[1]
            .innerText.match(/\d+/g)[0]
      );

      console.log(typeof content);

      return content;
    } catch (e) {}
  }
}

async function fillVerificationCode(page, verfication_code) {
  await page.bringToFront();
  await page.waitForSelector("input[name=email_confirmation_code]");
  await page.type("input[name=email_confirmation_code]", verfication_code);

  await page.evaluate(() =>
    document.querySelector("button[type=submit]").click()
  );
  return true;
}

async function main() {
  // initialize browser
  const adblocker = AdblockerPlugin({
    blockTrackers: true,
    useCache: false,
  });
  puppeteer.use(adblocker);
  puppeteer.use(StealthPlugin());

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

  /*        start        */
  const mailPage = await browser.newPage();
  const email = await getEmail(mailPage); // getting the email
  if (email === false) {
    // error while getting email
    console.log("error while getting email");
    return; // close the program
  }
  console.log(email);
  /* Got email */

  // create account info
  let AccountInfo = createAccountInfo(email);

  // fill the args at `https://www.instagram.com/accounts/emailsignup/`
  const signupPage = await browser.newPage();
  await FillAccountInfo(signupPage, AccountInfo);

  // get birth info
  let birthInfo = createBirthInfo();

  // fill the birth args
  await fillBirthInfo(signupPage, birthInfo);

  // get the verification code
  const verfication_code = await emailverify(mailPage);

  // fill the verification code
  await fillVerificationCode(signupPage, verfication_code);

  // agree to terms of use

  browser.close();
}

main();
