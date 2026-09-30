const {
  S3Client,
  ListObjectsV2Command
} = require("@aws-sdk/client-s3");

require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION
});

async function listS3Files(prefix = "") {
  const command = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: prefix
  });

  const response = await s3.send(command);

  return response.Contents || [];
}

module.exports = {
  s3,
  listS3Files
};