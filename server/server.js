const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const path = require('path');
const admin = require('firebase-admin');
dotenv.config();
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

console.log('All modules imported');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
console.log('Firebase initialized');

const db = admin.database();

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

    const prompt = `Create a lesson plan about ${topic} that lasts for ${duration} minutes where the kids are aged ${age} years old and have a ${englishLevel} English level. Format the response as a JSON array of arrays, where each inner array contains three elements: the activity type (e.g., "Energizer", "Learn", "Activity", "Game"), the activity description, and the duration in minutes. Do not add  \`\`\`json or any characters in front or back, return just the content.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI Response:', completion.choices[0].message.content);
    const lessonPlan = JSON.parse(completion.choices[0].message.content);

    // Save the lesson plan to Firebase
    const newLessonRef = db.ref('lessons').push();
    await newLessonRef.set({
      topic: topic,
      age: age,
      englishLevel: englishLevel,
      duration: duration, // Add this line
      lesson_prompt: `${topic} for ${age} year olds (${englishLevel} level) - ${duration} minutes`,
      lesson_content: JSON.stringify(lessonPlan),
      like_count: 0,
      time_generated: admin.database.ServerValue.TIMESTAMP
    });

    res.json({
      lessonPlan,
      lessonId: newLessonRef.key
    });
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({ error: 'An error occurred while generating the lesson plan' });
  }
});

app.post('/api/generate-topics', async (req, res) => {
  try {
    const { excludedTopics } = req.body;
    const excludedTopicsString = excludedTopics.join(', ');

    const prompt = `Give me 3 potential topics you can teach ESL kids about. Examples are numbers, colors, and animals. Don't suggest numbers, colors, animals${excludedTopicsString ? `, ${excludedTopicsString}` : ''}. These are younger kids, so keep it more concrete and less abstract. The result should be a JSON array without any markings or characters before or after the JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI Response:', completion.choices[0].message.content);
    const topics = JSON.parse(completion.choices[0].message.content);
    res.json(topics);
  } catch (error) {
    console.error('Error generating topics:', error);
    res.status(500).json({ error: 'An error occurred while generating topics' });
  }
});

app.post('/api/regenerate-block', async (req, res) => {
  try {
    const { topic, currentBlock, lessonPlan, englishLevel, age } = req.body;

    const prompt = `Given a lesson plan about ${topic} for ${age}-year-old students with ${englishLevel} English level, regenerate the following block:
    Type: ${currentBlock[0]}
    Description: ${currentBlock[1]}
    Duration: ${currentBlock[2]} minutes

    The new block should fit within the context of the overall lesson plan and maintain the same duration. Here's the current lesson plan for context:
    ${JSON.stringify(lessonPlan)}

    Provide the response as an array in the format [activity type,description,duration]. Do not include any additional text or formatting, it is a plain array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI Response:', completion.choices[0].message.content);
    const newBlock = JSON.parse(completion.choices[0].message.content);
    res.json(newBlock);
  } catch (error) {
    console.error('Error regenerating block:', error);
    res.status(500).json({ error: 'An error occurred while regenerating the block' });
  }
});

// Update the recent lessons endpoint
app.get('/api/recent-lessons', async (req, res) => {
  try {
    const lessonsRef = db.ref('lessons');
    const snapshot = await lessonsRef
      .orderByChild('time_generated')
      .limitToLast(10)
      .once('value');
    
    const lessons = [];
    snapshot.forEach((childSnapshot) => {
      const lessonData = childSnapshot.val();
      lessons.unshift({
        id: childSnapshot.key,
        topic: lessonData.topic,
        age: lessonData.age,
        englishLevel: lessonData.englishLevel,
        duration: lessonData.duration, // Add this line
        lesson_prompt: lessonData.lesson_prompt,
        lesson_content: lessonData.lesson_content,
        like_count: lessonData.like_count,
        time_generated: lessonData.time_generated
      });
    });
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching recent lessons:', error);
    res.status(500).json({ error: 'An error occurred while fetching recent lessons' });
  }
});

// Method for ChaiMai app.
app.post('/api/generate-deck', async (req, res) => {
  try {
    const { topic, numCards } = req.body;

    const prompt = `Give me a list of  ${numCards || 50}  people, places or things that are related to ${topic}.
    They are going to be used for a charades guessing game similar to heads up,
    so try to have a mix of common and creative words. Don't have any repeats or very similar words. 
    Format the response as a JSON object with the following structure:
    {
      "deckname": "Sea Animals",
      "deck_id": "sea_animals",
      "cards": [
        {
          "cardname": "term in English",
          "th": "translation in Thai"
        }
      ]
    }
    Return only the JSON without any additional text or formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log('OpenAI Response:', completion.choices[0].message.content);
    const flashcards = JSON.parse(completion.choices[0].message.content);

    res.json(flashcards);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'An error occurred while generating flashcards' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
console.log('Server setup complete');