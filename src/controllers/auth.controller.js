
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const authService = require("../services/auth.service");

const authCookieName = process.env.AUTH_COOKIE_NAME || "venturevista.sid";
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ========================================
// 1. VALIDATION SCHEMAS
// ========================================

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(12)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must not exceed 72 bytes"
  );

const travelerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: emailSchema,
  password: passwordSchema,
  telephoneNumber: z.string().trim().min(7).max(20),
  country: z.string().trim().min(2).max(100),
  travelInterests: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .optional()
    .default([]),
});

const guideSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: emailSchema,
  password: passwordSchema,
  telephoneNumber: z.string().trim().min(7).max(20),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  dailyRateLkr: z.coerce
    .number()
    .finite()
    .min(0)
    .max(10000000),

  baseLocation: z.string().trim().min(2).max(150),

  languages: z
    .array(z.string().trim().min(1).max(50))
    .min(1)
    .max(20),
  shortBio: z.string().trim().min(10).max(500),

  sltdaLicenseNumber: z
    .string()
    .trim()
    .min(2)
    .max(100),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

// ========================================
// 2. VALIDATE REQUEST DATA
// ========================================

function validate(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const error = new Error(
      "Please check the submitted fields"
    );

    error.status = 400;
    error.details = result.error.flatten().fieldErrors;

    throw error;
  }

  return result.data;
}

// ========================================
// 3. REGISTER TRAVELER
// ========================================

async function registerTraveler(req, res, next) {
  try {
    const data = validate(travelerSchema, req.body);

    const user = await authService.registerTraveler(data);

    return res.status(201).json({
      success: true,
      message: "Traveler registered successfully",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

// ========================================
// 4. REGISTER GUIDE
// ========================================

async function registerGuide(req, res, next) {
  try {
    const data = validate(guideSchema, req.body);

    const user = await authService.registerGuide(data);

    return res.status(201).json({
      success: true,
      message: "Guide application submitted for verification",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

// ========================================
// 5. LOGIN
// ========================================

async function login(req, res, next) {
  try {
    const data = validate(loginSchema, req.body);

    const user = await authService.login(
      data.email,
      data.password
    );

    const token = jwt.sign(
      { sub: String(user.id) },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie(authCookieName, token, authCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

// ========================================
// 6. GET CURRENT LOGGED-IN USER
// ========================================

async function me(req, res, next) {
  try {
    const token = req.cookies?.[authCookieName];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in",
      });
    }

    let userId;
    try {
      userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    } catch {
      res.clearCookie(authCookieName, authCookieOptions);
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    const user = await authService.getUserById(userId);

    if (!user || user.status === "suspended") {
      res.clearCookie(authCookieName, authCookieOptions);
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function listGuides(req, res, next) {
  try {
    const guides = await authService.listGuides();
    return res.status(200).json({ success: true, guides });
  } catch (error) {
    return next(error);
  }
}

// ========================================
// 7. LOGOUT
// ========================================

function logout(req, res) {
  res.clearCookie(authCookieName, authCookieOptions);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

// ========================================
// 8. EXPORT CONTROLLER FUNCTIONS
// ========================================

module.exports = {
  registerTraveler,
  registerGuide,
  login,
  me,
  listGuides,
  logout,
};
