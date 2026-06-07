const express = require('express');
const router = express.Router();

const User = require('../models/user');
const authMiddleware = require('../auth');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const { GoogleGenAI } = require('@google/genai');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it in Render environment variables.");
}

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing. Add it in Render environment variables.");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// ---------------- Gemini Prompt Function Starts ----------------

function generateGeminiPrompt(junior, seniors, additionalNotes = "") {
  const juniorInfo = `
Junior Preferences:
- Field of Interest: ${junior?.preferences?.fieldInterest || "N/A"}
- College Type: ${junior?.preferences?.collegeType || "N/A"}
- Preferred Location: ${junior?.preferences?.locationPreference || "N/A"}
`;

  let seniorsInfo = "";

  seniors.forEach((senior, idx) => {
    seniorsInfo += `
Senior ${idx + 1}:
- Name: ${senior.name || "N/A"}
- Field of Study: ${senior?.fieldOfStudy || "N/A"}
- College: ${senior?.college || "N/A"}
- Goals: ${senior?.goals || "N/A"}
- Fee: ${senior?.currentFee || "N/A"}
- City: ${senior?.city || "N/A"}
- Degree: ${senior?.degree || "N/A"}
- seniorId: ${senior?._id?.toString() || "N/A"}
`;
  });

  return `
You are given a junior profile and a list of senior profiles.

Your task is to evaluate and return the top 5 senior profiles that match the junior's preferences the best.

Important rules:
1. Return ONLY valid JSON.
2. Do not add markdown.
3. Do not add \`\`\`json blocks.
4. Do not add extra explanation outside JSON.
5. The response must be a JSON array.
6. Return at most 5 seniors.
7. Sort from highest matchPercentage to lowest.
8. matchPercentage must be a number between 0 and 100.
9. seniorId must be copied exactly from the senior profile.
10. Each object must have exactly these fields:
   - name
   - matchPercentage
   - reason
   - seniorId

Expected output format:
[
  {
    "name": "Senior Name",
    "matchPercentage": 85,
    "reason": "Short reason why this senior matches the junior",
    "seniorId": "seniorId"
  }
]

Junior Details:
${juniorInfo}

Additional Notes from Junior:
${additionalNotes || "None provided."}

Seniors:
${seniorsInfo}
`;
}

// ---------------- Gemini Prompt Function Ends ----------------

function cleanGeminiJsonText(text) {
  if (!text) return "";

  return String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeMatches(parsedResult) {
  if (!Array.isArray(parsedResult)) {
    return [];
  }

  return parsedResult
    .filter(item => item && typeof item === "object")
    .map(item => ({
      name: item.name || "Unknown Senior",
      matchPercentage: Number(item.matchPercentage) || 0,
      reason: item.reason || "No reason provided.",
      seniorId: item.seniorId || "",
    }))
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);
}

router.get('/', (req, res) => {
  try {
    res.status(200).json("What the hell it is working! Welcome to the TO_DO_LIST server");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-full-user", async (req, res) => {
  try {
    const {
      name,
      email,
      student,
      password,
      city,
      college,
      currentFee,
      degree,
      fieldOfStudy,
      goals,
      preferences,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "User already exists: " + existingUser.email });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      student,
      password: hashedPwd,
      city,
      college,
      currentFee,
      degree,
      fieldOfStudy,
      goals,
      preferences,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        student: newUser.student,
        preferences: newUser.preferences,
      },
    });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/seniorProfile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    let imageBase64 = null;

    if (user.image && user.image.data) {
      imageBase64 = `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`;
    }

    const data = {
      ...user.toObject(),
      image: imageBase64,
    };

    res.json({
      msg: `Hola ${user.name} ,`,
      data: data,
    });

  } catch (err) {
    console.error("Senior profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/protected', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let imageBase64 = null;

    if (user.image && user.image.data) {
      imageBase64 = `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`;
    }

    res.json({
      msg: `Hola ${user.name} ,`,
      name: user.name,
      email: user.email,
      student: user.student,
      data: {
        ...user.toObject(),
        image: imageBase64,
      },
    });
  } catch (err) {
    console.error("Protected route error:", err);
    res.status(500).json({ error: 'Brooo! Server error' });
  }
});

router.get('/allUsers', authMiddleware, async (req, res) => {
  try {
    const users = await User.find();

    const usersWithImages = users.map(user => {
      let imageBase64 = null;

      if (user.image && user.image.data) {
        imageBase64 = `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`;
      }

      return {
        ...user.toObject(),
        image: imageBase64,
      };
    });

    res.status(200).json(usersWithImages);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: '6h',
    });

    res.json({
      token,
      user: {
        id: user._id,
        student: user.student,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile/senior/:id', upload.single('image'), async (req, res) => {
  const { college, fieldOfStudy, goals, currentFee, city, degree } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.student !== "college") {
      return res.status(403).json({ msg: "Only seniors can update this profile" });
    }

    user.college = college || user.college;
    user.fieldOfStudy = fieldOfStudy || user.fieldOfStudy;
    user.goals = goals || user.goals;
    user.currentFee = currentFee || user.currentFee;
    user.city = city || user.city;
    user.degree = degree || user.degree;

    if (req.file) {
      user.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await user.save();

    res.status(200).json({
      msg: "Senior profile updated successfully",
      user,
    });

  } catch (err) {
    console.error("Senior update error:", err);
    res.status(500).json({ error: "Server error while updating senior profile" });
  }
});

router.put('/profile/junior/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { collegeType, fieldInterest, locationPreference } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.student === "senior") {
      return res.status(403).json({ msg: "Seniors cannot update preferences" });
    }

    user.preferences = {
      collegeType: collegeType || user.preferences?.collegeType,
      fieldInterest: fieldInterest || user.preferences?.fieldInterest,
      locationPreference: locationPreference || user.preferences?.locationPreference,
    };

    if (req.file) {
      user.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await user.save();

    res.status(200).json({
      msg: "Junior preferences updated successfully",
      user,
    });

  } catch (err) {
    console.error("Junior update error:", err);
    res.status(500).json({ error: "Server error while updating junior preferences" });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, student, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(existingUser);
      return res.status(400).json({
        msg: "User already exists says Aman" + existingUser,
      });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      student,
      password: hashedPwd,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: '6h',
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        student: newUser.student,
      },
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/match', async (req, res) => {
  try {
    const { juniorId, additionalNotes } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing on server",
      });
    }

    if (!juniorId) {
      return res.status(400).json({
        error: "juniorId is required",
      });
    }

    const junior = await User.findById(juniorId);

    if (!junior || junior.student !== "school") {
      return res.status(404).json({
        error: "Junior user not found",
      });
    }

    const seniors = await User.find({ student: "college" });

    if (!seniors || seniors.length === 0) {
      return res.status(404).json({
        error: "No senior profiles found",
      });
    }

    const prompt = generateGeminiPrompt(junior, seniors, additionalNotes);

    console.log("Gemini matching started for junior:", juniorId);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const rawText = response.text;
    const cleanedText = cleanGeminiJsonText(rawText);

    let parsedResult;

    try {
      parsedResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Gemini JSON parse error:", parseError);
      console.error("Raw Gemini response:", rawText);

      return res.status(500).json({
        error: "Gemini returned invalid JSON",
        rawResult: rawText,
      });
    }

    const finalMatches = normalizeMatches(parsedResult);

    return res.status(200).json({
      message: "Matching completed",
      result: finalMatches,
      rawResult: cleanedText,
    });

  } catch (err) {
    console.error("Matching error full details:", err);

    return res.status(500).json({
      error: "Something went wrong during matching",
      details: err.message,
    });
  }
});

module.exports = router;
