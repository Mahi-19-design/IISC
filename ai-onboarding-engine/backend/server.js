const express = require('express');
const cors = require('cors');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage });

async function extractTextFromFile(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!fs.existsSync(file.path)) {
        throw new Error("File not found.");
    }

    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (ext === '.docx' || ext === '.doc') {
            const result = await mammoth.extractRawText({ path: file.path });
            return result.value;
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (err) {
        if (err.message && err.message.includes("bad XRef entry")) {
            throw new Error("The PDF file is malformed. Please ensure it is a valid PDF and not an empty file or renamed text file.");
        }
        throw new Error(`Error extracting text: ${err.message}`);
    }
}

app.get('/', (req, res) => {
  res.send('AI Adaptive Onboarding Engine API is running');
});

const cpUpload = upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jobDescription', maxCount: 1 }]);

app.post('/upload', cpUpload, async (req, res) => {
  console.log("--- Received Upload Request ---");
  
  try {
      if (!req.files || !req.files['resume'] || !req.files['resume'][0]) {
          return res.status(400).json({ error: "Resume file is missing." });
      }

      const resumeFile = req.files['resume'][0];
      let resumeText = '';
      let jobDescriptionText = '';

      // Extract Resume Text
      resumeText = await extractTextFromFile(resumeFile);
      if (!resumeText || resumeText.trim() === '') {
          return res.status(400).json({ error: "Could not extract text from Resume. The file might be empty or unreadable." });
      }

      // Handle Job Description
      if (req.body.jobDescriptionText && req.body.jobDescriptionText.trim() !== '') {
          jobDescriptionText = req.body.jobDescriptionText;
      } else if (req.files['jobDescription'] && req.files['jobDescription'][0]) {
          jobDescriptionText = await extractTextFromFile(req.files['jobDescription'][0]);
          if (!jobDescriptionText || jobDescriptionText.trim() === '') {
              return res.status(400).json({ error: "Could not extract text from Job Description file." });
          }
      } else {
          return res.status(400).json({ error: "Job Description is missing (provide either text or file)." });
      }

      res.json({
          message: "Files processed successfully",
          resumeText: resumeText,
          jobDescriptionText: jobDescriptionText
      });

  } catch (error) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
