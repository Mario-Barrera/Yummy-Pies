const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// GET api/user-status
router.get("/", function (req, res) {
    const authHeader = req.headers.authorization;                      // extracts the Authorization HTTP header from the incoming request

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ loggedIn: false });
    }

    const token = authHeader.split(" ")[1];

    try {
        jwt.verify(token, process.env.JWT_SECRET);                  // checks whether a JWT token is valid and authentic
        return res.json({ loggedIn: true });
    } catch (err) {
        return res.json({ loggedIn: false });
    }
});

module.exports = router;