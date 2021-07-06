const { DIR, VID, EP, FAST, CLEAR, UPLOAD } = require("./config.js");
const { Downloader } = require("./download.js");
const { upload } = require("./upload.js");
const { create_issuer } = require("./gh.js");
const { get_video_info } = require("./info.js");

async function main() {
    if (!VID) {
        console.log("遺失影片代碼");
        return false;
    }

    let info = await get_video_info(VID);
    console.log(JSON.stringify(info, null, 4));

    let dlr = new Downloader(VID);
    dlr.set({
        dir: DIR,
        fast: FAST,
        clear: CLEAR,
    });

    if (EP === "000") {
        let ep = 1;
        let result = await dlr.set_ep(ep).download({ dl_percentage: false });
        let uploads = [];
        while (result.success) {
            if (UPLOAD) uploads.push(upload("", DIR, result.path));
            ep++;
            result = await dlr.set_ep(ep).download();
        }
        await Promise.all(uploads);
    } else {
        dlr.set_ep(EP);
        let result = await dlr.download();
        if (result.success) {
            if (UPLOAD) await upload("", DIR, result.path);
        }
    }

    console.log("所有程序皆已完成");
    return true;
}

exports.main = main;
