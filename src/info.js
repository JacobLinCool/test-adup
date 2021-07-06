const fetch = require("node-fetch");

async function get_video_info(id) {
    return await fetch(`https://myself-bbs.jacob.workers.dev/anime?id=${id}`).then((r) => r.json());
}

exports.get_video_info = get_video_info;
