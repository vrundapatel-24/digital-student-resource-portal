const express = require("express");

const router = express.Router();

const {
    s3
} = require("../services/s3");

const {
    ListObjectsV2Command,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");


/* =====================================================
   GET COURSES FROM AWS S3
===================================================== */

router.get("/", async (req, res) => {

    try {

        const bucket =
            process.env.S3_BUCKET_NAME;

        const courses = [];
        const files = [];

        let continuationToken = undefined;

        do {

            const command =
                new ListObjectsV2Command({

                    Bucket: bucket,

                    Prefix: "course/",

                    ContinuationToken:
                        continuationToken

                });

            const response =
                await s3.send(command);

            const objects =
                response.Contents || [];


            for (const object of objects) {

                const key =
                    object.Key;

                if (
                    !key ||
                    key === "course/"
                ) {
                    continue;
                }


                const relativePath =
                    key.replace("course/", "");

                const parts =
                    relativePath.split("/");


                /*
                 * Example:
                 *
                 * course/Cloud Computing/file.pdf
                 *
                 * parts:
                 * ["Cloud Computing", "file.pdf"]
                 */

                if (parts.length > 1) {

                    const courseName =
                        parts[0];

                    const coursePrefix =
                        `course/${courseName}/`;


                    /*
                     * Add course only once
                     */

                    if (
                        !courses.some(
                            course =>
                                course.name === courseName
                        )
                    ) {

                        courses.push({

                            name: courseName,

                            prefix: coursePrefix

                        });

                    }


                    /*
                     * Add actual file
                     */

                    if (!key.endsWith("/")) {

                        files.push({

                            course: courseName,

                            name:
                                parts
                                    .slice(1)
                                    .join("/"),

                            key: key,

                            size:
                                object.Size || 0,

                            lastModified:
                                object.LastModified || null

                        });

                    }

                } else {

                    /*
                     * Files directly inside
                     * course/ folder
                     */

                    files.push({

                        course: null,

                        name: relativePath,

                        key: key,

                        size:
                            object.Size || 0,

                        lastModified:
                            object.LastModified || null

                    });

                }

            }


            continuationToken =
                response.IsTruncated
                    ? response.NextContinuationToken
                    : undefined;

        } while (continuationToken);


        /*
         * Sort courses alphabetically
         */

        courses.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );


        res.json({

            success: true,

            bucket,

            courses,

            files

        });


    } catch (error) {

        console.error(
            "Error loading courses from S3:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load courses from S3."

        });

    }

});
/* =====================================================
   GET COURSE FILE URL
   mode = view / download
===================================================== */

router.get("/file-url", async (req, res) => {

    try {

        const key =
            req.query.key;


        const mode =
            req.query.mode === "download"
                ? "download"
                : "view";


        if (!key) {

            return res.status(400).json({

                success: false,

                message:
                    "File key is required."

            });

        }


        if (!key.startsWith("course/")) {

            return res.status(403).json({

                success: false,

                message:
                    "Access denied."

            });

        }


        const extension =
            key
                .split(".")
                .pop()
                .toLowerCase();


        let contentType =
            "application/octet-stream";


        if (extension === "pdf") {

            contentType =
                "application/pdf";

        } else if (
            extension === "docx"
        ) {

            contentType =
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        } else if (
            extension === "doc"
        ) {

            contentType =
                "application/msword";

        }


        const disposition =
            mode === "download"
                ? "attachment"
                : "inline";


        const command =
            new GetObjectCommand({

                Bucket:
                    process.env.S3_BUCKET_NAME,

                Key:
                    key,

                ResponseContentType:
                    contentType,

                ResponseContentDisposition:
                    disposition

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

            mode,

            url,

            fileType:
                extension,

            fileName:
                key.split("/").pop()

        });


    } catch (error) {

        console.error(
            "Error generating course file URL:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to generate course file URL."

        });

    }

});


module.exports = router;