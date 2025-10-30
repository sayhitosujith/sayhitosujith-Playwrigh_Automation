import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { LoginPage } from "../Pages/Login.js";
import fs from 'fs';
import path from 'path';

const testDataPath = path.resolve(process.cwd(), 'Files', 'Test-data', 'userdata.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8')) as { validusername: { email: string; password: string } };

const env = process.env.ENV || "qa";
const baseUrls: Record<string, string> = {
  qa: "https://www.naukri.com/nlogin/login",
  dev: "https://www.naukri.com/nlogin/login",
  prod: "https://www.naukri.com/nlogin/login",
};

const BASE_URL = process.env.NAUKRI_BASE_URL || baseUrls[env];

let loginPage: LoginPage;
const { validusername } = testData;

Given("I navigate to the Naukri login page", async function () {
  loginPage = new LoginPage(this.page);
  await this.page.goto(BASE_URL, { waitUntil: "networkidle" });
  await expect(loginPage.usernameinput).toBeVisible();
  console.log("✅ Navigated to login page");
});

When("I login with valid credentials", async function () {
  await loginPage.usernameinput.fill(validusername.email);
  await loginPage.passwordinput.fill(validusername.password);
  await expect(loginPage.loginbutton).toBeEnabled();
  await loginPage.loginbutton.click();
  console.log('✅ Logged in with valid credentials');

});

Then("I should be able to navigate to my profile", async function () {
  const profileLink = this.page.getByRole("link", { name: "View profile" });
  await expect(profileLink).toBeVisible();
  await profileLink.click();
  console.log("✅ Navigated to profile");
});