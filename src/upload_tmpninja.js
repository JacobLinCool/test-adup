const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

async function upload(token, folder, path) {
    let filename = path.split("/")[path.split("/").length - 1];
    console.log("上傳檔案中：" + filename);

    let form = new FormData();
    form.append("files[]", fs.readFileSync(path), filename);

    let upl = await fetch(`https://tmp.ninja/upload.php`, {
        method: "POST",
        body: form,
    })
        .then((r) => r.json())
        .then((result) => {
            console.log("上傳檔案已完成：" + filename);
            console.log(result.files[0].url);
        })
        .catch((err) => {
            console.log(`檔案上傳失敗：[${filename}] ${err.message}`);
        });
}

exports.upload = upload;

//let user = await fetch(`https://api.gofile.io/getAccountDetails?token=${token}&allDetails=true`).then((r) => r.json());
//console.log(user.data.email);
/*
    let created_folder = await fetch("https://api.gofile.io/createFolder", {
        method: "PUT",
        body: `token=${token}&parentFolderId=${encodeURIComponent(user.data.rootFolder)}&folderName=${encodeURIComponent(folder)}`,
    }).then((r) => r.json());
    console.log(created_folder);*/
//let host = await fetch(`https://api.gofile.io/getServer`).then((r) => r.json());
//console.log(host.data.server);

/*form.append("file", fs.readFileSync(path), filename);
    form.append("token", token);
    form.append("folderId", user.data.rootFolder);*/
/*
    let upl = await fetch(`https://${host.data.server}.gofile.io/uploadFile`, {
        method: "POST",
        body: form,
    }).then((r) => r.json());*/
