const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database");

const router = express.Router();

/* =====================================================
   REGISTER
===================================================== */

router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        const cleanUsername = username.trim();

        if (cleanUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username must be at least 3 characters."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        db.get(
            "SELECT id FROM users WHERE username = ?",
            [cleanUsername],
            async (err, existingUser) => {

                if (err) {
                    console.error("User check error:", err.message);

                    return res.status(500).json({
                        success: false,
                        message: "Database error."
                    });
                }

                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: "Username already exists."
                    });
                }

                const passwordHash =
                    await bcrypt.hash(password, 10);

                db.run(
                    `
                    INSERT INTO users
                    (username, password_hash)
                    VALUES (?, ?)
                    `,
                    [cleanUsername, passwordHash],
                    function (insertError) {

                        if (insertError) {
                            console.error(
                                "User registration error:",
                                insertError.message
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Failed to create account."
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: "Account created successfully.",
                            user: {
                                id: this.lastID,
                                username: cleanUsername
                            }
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});


/* =====================================================
   LOGIN
===================================================== */

router.post("/login", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });
    }

    const cleanUsername = username.trim();

    db.get(
        `
        SELECT id, username, password_hash
        FROM users
        WHERE username = ?
        `,
        [cleanUsername],
        async (err, user) => {

            if (err) {
                console.error("Login database error:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Database error."
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            const token = jwt.sign(
    {
        userId: user.id,
        username: user.username
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "7d"
    }
);

res.json({
    success: true,
    message: "Login successful.",
    token,
    user: {
        id: user.id,
        username: user.username
    }
});
        }
    );
});


module.exports = router;