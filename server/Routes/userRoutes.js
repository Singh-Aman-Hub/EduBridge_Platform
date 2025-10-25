const express= require('express')
const router= express.Router();
const User = require('../models/user');
const authMiddleware = require('../auth')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const storage = multer.memoryStorage(); // store image in memory as buffer
const upload = multer({ storage });

// const { GoogleGenAI } = require('@google/genai');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const gemini= process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(gemini); 

const JWT_SECRET= process.env.JWT_SECRET
// console.log("JWT_SECRET:", JWT_SECRET);

//Gemini Prompting function starts here-----

function generateGeminiPrompt(junior, seniors,additionalNotes="") {
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
- Name: ${senior.name}
- Field of Study: ${senior?.fieldOfStudy || "N/A"}
- College: ${senior?.college || "N/A"}
- Goals: ${senior?.goals || "N/A"}
- Fee: ${senior?.currentFee || "N/A"}
- city: ${senior?.city || "N/A"}
- degree: ${senior?.degree || "N/A"}
- seniorId: ${senior?._id || "N/A"}\n`;

  });

  return `
You are given a junior profile and a list of senior profiles.

Your task is to evaluate and return the top 5 senior profiles that match the junior's preferences the best.

Return the results in the following format:
[
  { "name": "Senior Name", "matchPercentage": 85, "reason": "..." ,"seniorId":"seniorId"},
  ...
]

Junior Details:
${juniorInfo}


Additional Notes from Junior:
${additionalNotes || "None provided."}

Seniors:
${seniorsInfo}
`;
}

//Gemini Prompt function ends here---

router.get('/', (req,res)=>{
    try{
        res.status(200).json("What the hell it is working! Welcome to the TO_DO_LIST server")
    }catch(err){
        res.status(500).json({error: err.message})
    }
})

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
      preferences, // will be saved as nested object
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

router.get('/seniorProfile/:id',async (req, res) => {
  try{
    const {id}= req.params;
    const user=await User.findById(id);
    let imageBase64 = null;

    if (user.image && user.image.data) {
      imageBase64 = `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`;
    }

    const data={
        ...user.toObject(),
        image: imageBase64,
    };
    
      res.json({msg: `Hola ${user.name+" "},`,
      
      data:data
      });
  }catch(err){
      res.status(500).json(err+"change it man!")
  }
});


router.get('/protected', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // ✅ Convert image buffer to base64 string if it exists
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
        image: imageBase64 // ✅ Send base64-encoded image instead of raw buffer
      }
    });
  } catch (err) {
    console.error(err);
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

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '6h' });

    res.json({ token, user: { id: user._id,student:user.student, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update senior extended profile with optional image
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

    // ✅ Update fields if provided
    user.college = college || user.college;
    user.fieldOfStudy = fieldOfStudy || user.fieldOfStudy;
    user.goals = goals || user.goals;
    user.currentFee = currentFee || user.currentFee;
    user.city = city || user.city;
    user.degree = degree || user.degree;

    // ✅ If image is uploaded, update image buffer & contentType
    if (req.file) {
      user.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await user.save();

    res.status(200).json({ msg: "Senior profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating senior profile" });
  }
});

// Update junior preferences with optional image
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

    // ✅ Update preferences
    user.preferences = {
      collegeType: collegeType || user.preferences.collegeType,
      fieldInterest: fieldInterest || user.preferences.fieldInterest,
      locationPreference: locationPreference || user.preferences.locationPreference
    };

    // ✅ If image is uploaded, update image buffer & contentType
    if (req.file) {
      user.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await user.save();

    res.status(200).json({ msg: "Junior preferences updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating junior preferences" });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, student,password} = req.body;
   
    
    const existingUser = await User.findOne({ email });
    if (existingUser){
        console.log(existingUser);
        return res.status(400).json({ msg: "User already exists says Aman" + existingUser});
    } 

    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, student ,password: hashedPwd});
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '6h' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        student: newUser.student,
        student:newUser.student,
      }
    });
    
  } catch (err) {
    // console.log(name,email,password)
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/match', async (req, res) => {
  try {
    // const juniorId = req.params.juniorId;
    const { juniorId, additionalNotes } = req.body; // new field from the frontend

    const junior = await User.findById(juniorId);
    if (!junior || junior.student !== "school") {
      return res.status(404).json({ error: "Junior user not found" });
    }

    const seniors = await User.find({ student: "college" });
    const prompt = generateGeminiPrompt(junior, seniors,additionalNotes);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Or "gemini-pro", based on what you want
    console.log("This is the prompt for GEMINI-"+prompt)

    const result = await model.generateContent(prompt);
    const response =  result.response;
    const text =  response.text();

    res.json({ message: "Matching completed", result: text });

  } catch (err) {
    console.error("Matching error:", err);
    res.status(500).json({ error: "Something went wrong during matching" });
  }
});


module.exports= router
