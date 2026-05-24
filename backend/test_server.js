import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Gemini API Key loaded:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');

if (!apiKey) {
  console.error('API key is missing from environment.');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);
const model = 'gemini-2.5-flash';

const systemInstruction = `You are CodeSage AI, a world-class senior code reviewer and security auditor.
Analyze the provided code for bugs, security vulnerabilities, performance bottlenecks, and maintainability issues.
Rate the code and return a detailed report in JSON format.

Your response MUST be valid JSON matching the following schema:
{
  "score": number (overall score from 0 to 100),
  "categories": {
    "bugs": number (score 0-100, where 100 is no bugs),
    "security": number (score 0-100, where 100 is fully secure),
    "performance": number (score 0-100, where 100 is highly optimized),
    "maintainability": number (score 0-100, where 100 is highly maintainable)
  },
  "issues": [
    {
      "id": string (unique short ID, e.g. "err-1"),
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "category": "bugs" | "security" | "performance" | "maintainability",
      "title": string (concise summary of the issue),
      "description": string (detailed description of why this is an issue),
      "lineStart": number (1-based line number where the issue starts, or null if general),
      "lineEnd": number (1-based line number where the issue ends, or null),
      "explanation": string (technical explanation of the underlying problem),
      "fixSuggestion": string (how to fix it),
      "improvedCode": string (fully corrected code snippet for this specific issue, or null)
    }
  ]
}

Ensure all JSON keys and values are strictly structured. Do not include markdown formatting or backticks outside the JSON. Return only the JSON object.`;

const code = `function processUserData(userId, userRole) {
  const query = "SELECT * FROM users WHERE id = '" + userId + "' AND role = '" + userRole + "'";
  db.execute(query, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }
    userDataStore = result[0];
  });
}`;

const userPrompt = `Language: javascript
Code to analyze:
\`\`\`
${code}
\`\`\``;

async function run() {
  try {
    const modelClient = ai.getGenerativeModel({ 
      model,
      systemInstruction
    });
    
    console.log('Sending request to Gemini...');
    const result = await modelClient.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { 
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const text = result.response.text();
    console.log('--- Raw Response Text ---');
    console.log(text);
    console.log('-------------------------');
    
    const parsed = JSON.parse(text);
    console.log('Parsing successful!');
    console.log('Score:', parsed.score);
    console.log('Issues Count:', parsed.issues?.length);
    if (parsed.issues && parsed.issues.length > 0) {
      console.log('Sample Issue Title:', parsed.issues[0].title);
    }
  } catch (err) {
    console.error('Test run failed:', err);
  }
}

run();
