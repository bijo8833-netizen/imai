// ebook.html -> guidebook.pdf 로 변환한다. build.py를 먼저 실행해서 ebook.html을 만든 다음 실행한다.
// 사용법: node render.js
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const dir = __dirname;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium";

  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  await page.goto("file://" + path.join(dir, "ebook.html"), { waitUntil: "networkidle" });
  await page.pdf({
    path: path.join(dir, "guidebook.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  });
  await browser.close();
  console.log("wrote guidebook.pdf");
})();
