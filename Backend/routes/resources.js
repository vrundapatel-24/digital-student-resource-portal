const express = require("express");
const {
    GetObjectCommand,
    ListObjectsV2Command
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
   HELPER
===================================================== */

function getPrefixFromRequest(req) {

    const type =
        String(
            req.query.type || ""
        ).toLowerCase();

    if (type === "note" || type === "notes") {
        return "notes/";
    }

    return "resources/";
}


/* =====================================================
   LIST FILES
   GET /api/resources
===================================================== */

router.get("/", async (req, res) => {

    try {

        const prefix =
            getPrefixFromRequest(req);

        const command =
            new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix
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
            "Resources list error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to load resources.",
            error:
                error.message
        });

    }

});


/* =====================================================
   S3 FILE LIST
   GET /api/resources/s3/list/files
===================================================== */

router.get(
    "/s3/list/files",
    async (req, res) => {

        try {

            const prefix =
                getPrefixFromRequest(req);

            const command =
                new ListObjectsV2Command({
                    Bucket: BUCKET,
                    Prefix: prefix
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
                            file.Key
                                .split("/")
                                .pop(),

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
                "S3 resource list error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to list S3 files.",
                error:
                    error.message
            });

        }

    }
);


/* =====================================================
   VALIDATE RESOURCE KEY
===================================================== */

function validateResourceKey(key) {

    if (!key) {
        return false;
    }

    return (
        key.startsWith("resources/") ||
        key.startsWith("notes/")
    );

}


/* =====================================================
   GET URL
   GET /api/resources/url?key=...
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
                !validateResourceKey(key)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid resource file."
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
                "Resource URL error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to create file URL.",
                error:
                    error.message
            });

        }

    }
);


/* =====================================================
   DOWNLOAD
   GET /api/resources/download?key=...
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
                !validateResourceKey(key)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid resource file."
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
                "Resource download error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to create download URL.",
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