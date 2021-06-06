
const { resolve, join } = require("path");
const {
    createReadStream,
    promises: { readdir, stat: getStats }
} = require("fs");

async function uploadFile({ path, params } = {}) {
    const parameters = { ...params };
    try {
        const rstream = createReadStream(resolve(path));
        rstream.once("error", err => {
            console.error(`unable to upload file ${path}, ${err.message}`);
        });
        parameters.Body = rstream;
        //  upload a file to s3 bucket
        await s3.upload(parameters).promise();
        console.info(`${parameters.Key} uploaded in bucket ${parameters.Bucket}`);
    } catch (e) {
        throw new Error(`unable to upload file ${path} at ${parameters.Key}, ${e.message}`);
    }
};

//credits: https://github.com/thousandxyz/s3-lambo

// upload directory and its sub-directories if any
async function uploadDirectory({ path, params, root = "" } = {}) {
    const parameters = { ...params };
    let dirPath;
    try {
        dirPath = resolve(path);
        const dirStats = await getStats(dirPath);

        if (!dirStats.isDirectory()) {
            throw new Error(`${dirPath} is not a directory`);
        }

        console.info(`uploading directory ${dirPath}...`);

        const files = await readdir(dirPath);

        if (!files || files.length === 0) {
            throw new Error(`provided folder '${distFolderPath}' is empty or does not exist.`);
        }

        await Promise.all(
            files.map(async file => {
                const filepath = `${dirPath}/${file}`;
                const fileStats = await getStats(filepath);
                if (fileStats.isFile()) {
                    parameters.Key = join(root, file);
                    await uploadFile({
                        params: parameters,
                        path: filepath
                    });
                } else if (fileStats.isDirectory()) {
                    await uploadDirectory({
                        params,
                        path: filepath,
                        root: join(root, file)
                    });
                }
            })
        );
    } catch (e) {
        throw new Error(`unable to upload directory ${path}, ${e.message}`);
    }
    console.info(`directory ${dirPath} successfully uploaded`);
};

module.exports = { uploadDirectory };
