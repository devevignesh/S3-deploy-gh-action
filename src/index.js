const AWS = require("aws-sdk");
const core = require("@actions/core");
const { uploadDirectory } = require("./util");

AWS.config.update({
    accessKeyId: core.getInput("aws-access-key-id"),
    secretAccessKey: core.getInput("aws-secret-access-key")
});

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

// create the parameters for calling createBucket
const bucketParams = {
    Bucket: `test-app-${core.getInput("release-tag-name")}`
};

console.log(bucketParams);

// call S3 to create the bucket
s3.createBucket(bucketParams, function (err, data) {
    if (err) {
        core.setFailed(`Error ${err}`);
    } else {
        core.info("Bucket created");
        if (data) {
            uploadDirectory({
                path: core.getInput("source-dir"),
                params: {
                    Bucket: bucketParams.Bucket
                }
            });
        }
    }
});
