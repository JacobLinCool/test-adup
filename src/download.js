const fetch = require("node-fetch");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { Counter } = require("./counter.js");

function gen_list(playlist) {
    let list = [];
    let line = playlist.split("\n");
    line.forEach((l) => {
        let trimed = l.trim();
        if (trimed && trimed[0] !== "#") list.push(trimed);
    });
    return list;
}

class Downloader {
    constructor(vid, ep) {
        this.vid = vid;
        if (ep) this.set_ep(ep);

        this.set({
            dir: "./files/",
            fast: true,
            clear: true,
        });
    }

    set(config) {
        this.config = config;
        return this;
    }

    set_ep(ep) {
        this.ep = String(ep).padStart(3, "0");
        return this;
    }

    async download(opts) {
        this.dl_opts = opts;
        console.log(`\n>>> 下載影片： 代碼 ${this.vid} 集數 ${this.ep}`);
        this.check_dir(`${this.config.dir}/${this.vid}/${this.ep}/`);

        // 確認是否已經有處理完成的影片
        if (fs.existsSync(`${this.config.dir}${this.vid}/${this.ep}.mp4`)) {
            console.log(`影片檔案已經存在：[${this.ep}.mp4] 跳過集數 ${this.ep}`);
            if (this.config.clear) this.clear_dir();
            return {
                success: true,
                code: "exists",
                path: `${this.config.dir}${this.vid}/${this.ep}.mp4`,
            };
        }

        // 抓取影片資料
        console.log("正在獲取影片資料");
        let source = await fetch(`https://v.myself-bbs.com/vpx/${this.vid}/${this.ep}/`).then((r) => {
            if (r.status === 200) return r.json();
            return { err: r.status };
        });
        if (source.err) {
            console.log("無法獲取影片資料，錯誤碼：" + source.err);
            if (this.config.clear) this.clear_dir();
            return {
                success: false,
                code: "get_data_failed_" + source.err,
            };
        }
        this.path = source.video["720p"].split("/").splice(0, 2).join("/") + "/";
        console.log("已獲取影片資料");

        // 抓取 m3u8
        console.log("正在獲取影片檔案列表");
        let host = source.host.map((x) => x.host);
        let playlist;
        for (let i = 0; !playlist && i < host.length; i++)
            playlist = await fetch(host[i] + this.path + "720p.m3u8").then((r) => {
                if (r.ok) return r.text();
                else console.log(`Playlist Error: HTTP CODE ${r.status} (${r.url})`);
            });
        let list = gen_list(playlist);
        fs.writeFileSync(`${this.config.dir}${this.vid}/${this.ep}/index.m3u8`, playlist);
        console.log("已獲取影片檔案列表");

        // 抓取影片檔
        console.log("正在下載影片檔案");
        this.dl_counter = new Counter();
        let dl = [];
        list.forEach((filename) => {
            dl.push(this.download_ts(host.slice(), filename, list.length));
        });
        await Promise.all(dl);
        console.log("所有影片檔案皆已下載");

        console.log("正在進行轉檔");
        await new Promise((r) => {
            let command = ffmpeg(`${this.config.dir}${this.vid}/${this.ep}/index.m3u8`)
                .on("progress", (progress) => {
                    try {
                        console.log(`轉檔中: ${progress.percent.toFixed(1)}% 已完成`);
                    } catch (e) {
                        console.log(`轉檔中`);
                    }
                })
                .on("end", r);

            if (this.config.fast) command.outputOptions("-c copy");

            command.output(`${this.config.dir}${this.vid}/${this.ep}.mp4`).run();
        });
        console.log("轉檔已完成");

        if (this.config.clear) this.clear_dir();

        return {
            success: true,
            code: "finished",
            path: `${this.config.dir}${this.vid}/${this.ep}.mp4`,
        };
    }

    clear_dir() {
        console.log("正在移除暫存檔案");
        fs.rmdirSync(`${this.config.dir}${this.vid}/${this.ep}/`, { recursive: true });
        console.log("暫存檔案已移除");
    }

    async download_ts(host, filename, total) {
        let self = this;
        let retry = host.length;
        while (retry--) {
            let success = true;
            if (fs.existsSync(`${this.config.dir}${this.vid}/${this.ep}/${filename}`)) {
                this.dl_counter.add();
                console.log(`檔案已經存在：[${filename}] ${((this.dl_counter.count / total) * 100).toFixed(1)}% (${this.dl_counter.count}/${total})`);
            } else {
                await dl().catch((err) => {
                    success = false;
                    console.log(err.message);
                    console.log(`下載失敗：[${filename}] 將再嘗試下載 ${retry} 次`);
                });
            }
            if (success) return true;
        }
        return false;

        function dl() {
            let random_host = host.splice(Math.floor(Math.random() * host.length), 1)[0];
            return fetch(`${random_host}${self.path}${filename}`)
                .then((r) => {
                    if (r.status !== 200) throw new Error(`HTTP CODE: ${r.status} (${r.url})`);
                    return r.buffer();
                })
                .then((b) => {
                    fs.writeFileSync(`${self.config.dir}${self.vid}/${self.ep}/${filename}`, b);
                    self.dl_counter.add();
                    if (!(self.dl_opts && self.dl_opts.dl_percentage === false))
                        console.log(`已下載：[${filename}] ${((self.dl_counter.count / total) * 100).toFixed(1)}% (${self.dl_counter.count}/${total})`);
                    return b;
                });
        }
    }

    check_dir(path) {
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
    }
}

exports.Downloader = Downloader;
