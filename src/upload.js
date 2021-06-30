const puppeteer = require("puppeteer-core");
const fs = require("fs");

async function upload(token, folder, path) {
    let filename = path.split("/")[path.split("/").length - 1];
    console.log("上傳檔案中：" + filename);

    let browser = await puppeteer.launch({
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: true,
        defaultViewport: {
            width: 414,
            height: 736,
            isMobile: true,
        },
        args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
    });

    let page = await browser.newPage();
    await page.goto("https://wormhole.app/");
    await page.waitForTimeout(5000);
    await page.click("div.chakra-stack div.css-dxfd61 button.chakra-button");

    const [file_chooser] = await Promise.all([page.waitForFileChooser(), page.click("#menu-list-10-menuitem-11")]);
    await file_chooser.accept([path]);
    await page.waitForSelector("input.chakra-input.css-7a80re");
    let dl_link = await page.$eval("input.chakra-input.css-7a80re", (node) => node.value);
    console.log(`檔案上傳中但已可供下載 [${filename}] ${dl_link}`);
    let id = setInterval(async () => {
        let percentage = (await page.$eval(".css-177at4r", (node) => parseFloat(node.ariaValueNow || 0))).toFixed(1);
        console.log(`檔案上傳中但已可供下載 [${filename}] (${percentage}%) ${dl_link}`);
    }, 60 * 1000);

    await page.waitForSelector(
        "#__next > div > div.css-1vuh1uo > div.css-0 > div > div.css-1qqk0tr > div > div > div > div.css-141j67k > div:nth-child(2) > div > div > div:nth-child(2) > div.chakra-offset-slide > div > h2",
        {
            timeout: 2 * 60 * 60 * 1000,
        }
    );

    clearInterval(id);
    console.log(`檔案已完成上傳，可於 24 小時內下載 [${filename}] ${dl_link}`);

    await page.close();
    await browser.close();
}

exports.upload = upload;
