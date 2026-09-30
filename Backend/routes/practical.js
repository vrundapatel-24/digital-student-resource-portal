const express = require("express");

const {
    ListObjectsV2Command,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

const {
    s3
} = require("../services/s3");

const router = express.Router();

const BUCKET =
    process.env.S3_BUCKET_NAME;


/* =====================================================
   LIST PRACTICAL FILES
   GET /api/practical
===================================================== */

router.get("/", async (req, res) => {

    try {

        const command =
            new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: "practicals/"
            });

        const response =
            await s3.send(command);

        const files =
            (response.Contents || [])
                .filter(file =>
                    file.Key &&
                    !file.Key.endsWith("/")
                )
                .map(file => ({
                    name:
                        file.Key.split("/").pop(),

                    key:
                        file.Key,

                    s3_key:
                        file.Key,

                    size:
                        file.Size || 0,

                    size_bytes:
                        file.Size || 0,

                    lastModified:
                        file.LastModified,

                    type:
                        getFileExtension(
                            file.Key
                        )
                }));


        res.json({
            success: true,
            files
        });

    } catch (error) {

        console.error(
            "Practicals error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to load practicals.",
            error:
                error.message
        });

    }

});


/* =====================================================
   PRACTICAL FILE URL
   GET /api/practical/url?key=...
===================================================== */

router.get(
    "/url",
    async (req, res) => {

        try {

            const key =
                String(
                    req.query.key || ""
                );

            if (
                !key.startsWith(
                    "practicals/"
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid practical file."
                });

            }


            const command =
                new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: key
                });


            const url =
                await getSignedUrl(
                    s3,
                    command,
                    {
                        expiresIn: 300
                    }
                );


            res.json({
                success: true,
                url
            });

        } catch (error) {

            console.error(
                "Practical URL error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to create practical URL.",
                error:
                    error.message
            });

        }

    }
);


/* =====================================================
   PRACTICAL DOWNLOAD
   GET /api/practical/download?key=...
===================================================== */

router.get(
    "/download",
    async (req, res) => {

        try {

            const key =
                String(
                    req.query.key || ""
                );

            if (
                !key.startsWith(
                    "practicals/"
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid practical file."
                });

            }


            const command =
                new GetObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    ResponseContentDisposition:
                        "attachment"
                });


            const url =
                await getSignedUrl(
                    s3,
                    command,
                    {
                        expiresIn: 300
                    }
                );


            res.json({
                success: true,
                url
            });

        } catch (error) {

            console.error(
                "Practical download error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to create practical download URL.",
                error:
                    error.message
            });

        }

    }
);


/* =====================================================
   FILE EXTENSION
===================================================== */

function getFileExtension(
    fileName
) {

    const name =
        String(fileName || "");

    const index =
        name.lastIndexOf(".");

    if (index === -1) {
        return "FILE";
    }

    return name
        .substring(index + 1)
        .toUpperCase();

}


module.exports = router;