const { argv } = require("process");

const CONFIG = {
    DIR: "./files/",
    VID: argv[2],
    EP: (argv[3] || "").padStart(3, "0"),
    FAST: !(argv[4] == "false" || argv[4] == "0" || false),
    CLEAR: !(argv[5] == "false" || argv[5] == "0" || false),
    UPLOAD: !(argv[6] == "false" || argv[6] == "0" || false),
};

console.log("使用的設定：\n" + JSON.stringify(CONFIG, null, 2));

module.exports = CONFIG;
