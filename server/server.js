const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const path = require('path');

dotenv.config();

const allowedOrigins = ['https://sporicle.github.io'];
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate-lesson-plan', async (req, res) => {
  try {
    const { topic, duration, age, englishLevel } = req.body;

    const prompt = `Create a lesson plan about ${topic} that lasts for ${duration} minutes where the kids are aged ${age} years old and have a ${englishLevel} English level. Format the response as a JSON array of arrays, where each inner array contains three elements: the activity type (e.g., "Energizer", "Learn", "Activity", "Game"), the activity description, and the duration in minutes. Do not ad  \`\`\`json in front, return just the content.;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI Response:', completion.choices[0].message.content);
    const lessonPlan = JSON.parse(completion.choices[0].message.content);
    res.json(lessonPlan);
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({ error: 'An error occurred while generating the lesson plan' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});