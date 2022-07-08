const puppeteer = require("puppeteer");
const fs = require("fs");
const uuid = require("uuid");

/* get config */
const config = require("./config.json");

async function getEmail(page) {
  await page.bringToFront();
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

function createAccountInfo(email) {
  function getUsername() {
    // make random names from `names.txt`
    const names = fs.readFileSync("names.txt", "utf8");
    username =
      names.split("\n")[Math.floor(Math.random() * names.split("\n").length)];
    username = username.replace(" ", "_");
    username = username + String(Math.random() * 100000).split(".")[0];
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
  await dsne(page, "emailOrPhone", accountInfo.email);
  await dsne(page, "fullName", accountInfo.fullName);
  await dsne(page, "username", accountInfo.username);
  await dsne(page, "password", accountInfo.password);

  // click sign up button
  const btnSignUp = await page.$("button[type=submit]");
  await btnSignUp.click();
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

  // browser.close();
}

main();
