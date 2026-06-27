const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")


async function authUser(req, res, next) {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                message: "Access denied. Please login first."
            })
        }

        // Check if token is blacklisted (logged out)
        const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token })

        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "Session expired. Please login again."
            })
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded

        next()

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Session expired. Please login again."
            })
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token. Please login again."
            })
        }

        console.error("Auth middleware error:", error)
        return res.status(500).json({
            message: "Something went wrong."
        })
    }
}


module.exports = { authUser }