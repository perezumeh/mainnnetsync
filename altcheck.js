import express from "express";
import Cap from "@cap.js/server";

export const cap = new Cap({
  difficulty: 4,
  expiresMs: 5 * 60 * 1000,
});

const router = express.Router();

/*
 * Create a Cap challenge
 */
router.post("/challenge", async (req, res) => {
  try {
    const challenge = await cap.createChallenge();

    res.json(challenge);
  } catch (err) {
    console.error("CAPTCHA generation error:", err);

    res.status(500).json({
      success: false,
      error: "Failed to create challenge",
    });
  }
});


/*
 * Redeem the challenge
 */
router.post("/redeem", async (req, res) => {
  try {
    const { token, solutions, instr } = req.body;

    if (!token || !solutions) {
      return res.status(400).json({
        success: false,
        error: "Missing token or solutions",
      });
    }

    const result = await cap.redeemChallenge({
      token,
      solutions,
      instr,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message || "CAPTCHA verification failed",
      });
    }

    /*
     * Challenge was successfully redeemed.
     */
    req.session.capVerified = true;

    return res.json({
      success: true,
      token: result.token,
      expires: result.expires,
    });

  } catch (err) {
    console.error("CAPTCHA verification error:", err);

    return res.status(500).json({
      success: false,
      error: "CAPTCHA verification error",
    });
  }
});


/*
 * Check whether this session has already
 * passed Cap verification.
 */
router.post("/verify", (req, res) => {
  if (req.session?.capVerified === true) {
    return res.json({
      verified: true,
    });
  }

  return res.status(403).json({
    verified: false,
  });
});


/*
 * Middleware protecting pages/routes
 */
export function requireCap(req, res, next) {
  if (req.session?.capVerified === true) {
    return next();
  }

  return res.sendFile("capcheck.html", {
    root: "views",
  });
}


export default router;
