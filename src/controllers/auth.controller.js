const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const emailService = require("../services/email.service");
const { logAction, AuditActions, extractRequestInfo } = require("../services/audit.service");

// Helper to generate access & refresh tokens
function generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
}

// Helper to set token cookies
function setTokenCookies(res, accessToken, refreshToken) {
    res.cookie("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

// User Register Controller
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;
        const reqInfo = extractRequestInfo(req);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({
                message: "Email already registered",
                status: "failed"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, name, password: hashedPassword }
        });

        const family = uuidv4();
        const { accessToken, refreshToken } = generateTokens(user.id);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                family,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        setTokenCookies(res, accessToken, refreshToken);

        // Audit log: user registered
        logAction(user.id, AuditActions.USER_REGISTERED, {
            entity: "User",
            entityId: user.id,
            metadata: { email: user.email },
            ...reqInfo,
        });

        res.status(201).json({
            user: {
                _id: user.id,
                email: user.email,
                name: user.name
            },
            token: accessToken
        });

        // Send registration email asynchronously
        emailService.sendRegisterationEmail(user.email, user.name).catch(err => {
            console.error("Failed to send welcome email:", err);
        });
    } catch (error) {
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
}

// User Login Controller
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;
        const reqInfo = extractRequestInfo(req);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                message: "Email or password is invalid"
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or password is invalid"
            });
        }

        const family = uuidv4();
        const { accessToken, refreshToken } = generateTokens(user.id);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                family,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        setTokenCookies(res, accessToken, refreshToken);

        // Audit log: user login
        logAction(user.id, AuditActions.USER_LOGIN, {
            entity: "User",
            entityId: user.id,
            metadata: { email: user.email },
            ...reqInfo,
        });

        res.status(200).json({
            user: {
                _id: user.id,
                email: user.email,
                name: user.name
            },
            token: accessToken
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
}

// Token Refresh Controller (with Rotation & Reuse Detection)
async function userRefreshController(req, res) {
    const incomingRefreshToken = req.cookies.refreshToken;
    const reqInfo = extractRequestInfo(req);

    if (!incomingRefreshToken) {
        return res.status(401).json({ message: "Refresh token is missing" });
    }

    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: incomingRefreshToken }
        });

        if (!storedToken) {
            // DETECTED REUSE: token was already consumed — revoke entire family
            await prisma.refreshToken.deleteMany({
                where: { userId: decoded.userId }
            });

            // Audit log: token reuse detected (security event)
            logAction(decoded.userId, AuditActions.TOKEN_REUSE_DETECTED, {
                entity: "RefreshToken",
                metadata: { reason: "Refresh token reuse detected, all sessions revoked" },
                ...reqInfo,
            });

            res.clearCookie("token");
            res.clearCookie("refreshToken");
            return res.status(403).json({
                message: "Security alert: Refresh token reuse detected. All sessions revoked."
            });
        }

        // Rotate: delete old token, issue new pair atomically
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        await prisma.$transaction([
            prisma.refreshToken.delete({ where: { id: storedToken.id } }),
            prisma.refreshToken.create({
                data: {
                    userId: decoded.userId,
                    token: newRefreshToken,
                    family: storedToken.family, // same family for rotation tracking
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        setTokenCookies(res, accessToken, newRefreshToken);

        // Audit log: token refreshed
        logAction(decoded.userId, AuditActions.TOKEN_REFRESHED, {
            entity: "RefreshToken",
            metadata: { family: storedToken.family },
            ...reqInfo,
        });

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true }
        });

        res.status(200).json({
            user: {
                _id: user.id,
                email: user.email,
                name: user.name
            },
            token: accessToken
        });
    } catch (error) {
        res.clearCookie("token");
        res.clearCookie("refreshToken");
        return res.status(401).json({ message: "Invalid or expired refresh token", error: error.message });
    }
}

// User Logout Controller
async function userLogoutController(req, res) {
    try {
        const accessToken = req.cookies.token || req.headers.authorization?.split(" ")[1];
        const refreshToken = req.cookies.refreshToken;
        const reqInfo = extractRequestInfo(req);

        // Try to identify the user for audit logging
        let userId = null;
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (_) {
                // Token may be expired, that's OK for logout
            }
        }

        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }

        if (accessToken) {
            // Blacklist the access token so it cannot be reused
            await prisma.tokenBlacklist.create({
                data: {
                    token: accessToken,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // matches access token TTL
                }
            }).catch(() => {}); // ignore duplicate
        }

        // Audit log: user logout
        logAction(userId, AuditActions.USER_LOGOUT, {
            entity: "User",
            entityId: userId,
            ...reqInfo,
        });

        res.clearCookie("token");
        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "User logged out successfully"
        });
    } catch (error) {
        res.status(500).json({ message: "Logout failed", error: error.message });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userRefreshController,
    userLogoutController
};
