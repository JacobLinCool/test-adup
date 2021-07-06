const github = require("@actions/github");

const context = github.context || null;

let octokit;

class Issuer {
    constructor(data, ani_data) {
        this.number = data.number;
        this.octokit = octokit;
        this.title = data.title;
        this.series = this.get_series(ani_data);

        this.owner = context.repo.owner;
        this.repo = context.repo.repo;

        console.log(`Issuer Set. OWNER: ${this.owner}, REPO: ${this.repo}, ID: ${this.number}`);
    }

    async update() {
        await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
            owner: this.owner,
            repo: this.repo,
            issue_number: this.number,
            title: this.title,
            body: this.gen_body(),
        });
    }

    gen_body(end = false) {
        let time = time_info();
        let body = `**${end ? "Finished" : "Updated"}.** (${time[0]}/${time[1]}/${time[2]} ${time[3]}:${time[4]}:${time[5]})\n\n`;
        Object.entries(this.series).forEach(([name, series]) => {
            body += `## ${name}\n\n`;
            Object.entries(series).forEach(([ep_name, url]) => {
                body += `**[${ep_name}](${url})**\n\n`;
            });
        });
        return body;
    }

    get_series(ani) {
        let s = {};
        s[ani.name] = {};
        for (let i = 0; i < ani.ep.length; i++) {
            s[ani.name][ani.ep[i]] = "";
        }
        return s;
    }

    async end() {
        await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
            owner: this.owner,
            repo: this.repo,
            issue_number: this.number,
            title: "[Finished] " + this.title,
            body: this.gen_body(true),
            labels: ["download", "finished"],
        });
    }
}

async function create_issuer(pat, data, title = null) {
    if (!context) return null;
    octokit = github.getOctokit(pat);

    let time = time_info();

    let res = await octokit.request("POST /repos/{owner}/{repo}/issues", {
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: title || `Download (${time[0]}/${time[1]}/${time[2]})`,
        body: `**Created.** (${time[0]}/${time[1]}/${time[2]} ${time[3]}:${time[4]}:${time[5]})\n\n`,
        labels: ["download", "running"],
    });

    return new Issuer(res.data, data);
}

function time_info() {
    const [date, time] = new Date()
        .toLocaleString("en-GB", { timeZone: "Asia/Taipei" })
        .split(",")
        .map((x) => x.trim());
    const [dt, mt, yr] = date.split("/");
    const [hr, mn, sc] = time.split(":");
    return [yr, mt, dt, hr, mn, sc];
}

exports.create_issuer = create_issuer;
