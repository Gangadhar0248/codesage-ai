import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to get Google GenAI client
const getGeminiClient = (req) => {
  // Check if frontend passed an API key in headers, otherwise use environment variable
  const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please configure it in the backend or enter it in the settings.');
  }
  // Initialize GoogleGenerativeAI client (SDK v0.21.0)
  // The constructor expects the API key string.
  return new GoogleGenerativeAI(apiKey);
};

// Helper function to clean markdown wrappers from LLM responses
const cleanJsonString = (text) => {
  if (!text) return '';
  let clean = text.trim();
  
  if (clean.startsWith('```')) {
    const firstNewline = clean.indexOf('\n');
    const lastBackticks = clean.lastIndexOf('```');
    if (firstNewline !== -1 && lastBackticks !== -1) {
      clean = clean.substring(firstNewline + 1, lastBackticks).trim();
    } else if (firstNewline !== -1) {
      clean = clean.substring(firstNewline + 1).trim();
    }
  }
  
  // Strip starting 'json' label if present after backtick strip
  if (clean.startsWith('json\n') || clean.startsWith('json\r\n')) {
    clean = clean.replace(/^json[\r\n]+/, '').trim();
  }
  
  // Remove potential starting ```json
  if (clean.startsWith('```json')) {
    clean = clean.substring(7).trim();
  }
  if (clean.endsWith('```')) {
    clean = clean.substring(0, clean.length - 3).trim();
  }
  
  return clean;
};

// Guarantee JSON report schema properties
const normalizeReport = (raw) => {
  const report = raw || {};
  const score = typeof report.score === 'number' ? report.score : parseInt(report.score) || 0;
  
  const categories = {
    bugs: 100,
    security: 100,
    performance: 100,
    maintainability: 100,
    ...(report.categories || {})
  };
  
  for (const key of ['bugs', 'security', 'performance', 'maintainability']) {
    categories[key] = typeof categories[key] === 'number' ? categories[key] : parseInt(categories[key]) || 100;
  }
  
  let issues = Array.isArray(report.issues) ? report.issues : [];
  issues = issues.map((issue, idx) => {
    const severity = (issue.severity || 'LOW').toUpperCase();
    const category = (issue.category || 'maintainability').toLowerCase();
    
    return {
      id: issue.id || `issue-${idx + 1}`,
      severity: ['HIGH', 'MEDIUM', 'LOW'].includes(severity) ? severity : 'LOW',
      category: ['bugs', 'security', 'performance', 'maintainability'].includes(category) ? category : 'maintainability',
      title: issue.title || 'Code Smell / Recommendation',
      description: issue.description || 'No detailed description provided.',
      lineStart: typeof issue.lineStart === 'number' ? issue.lineStart : parseInt(issue.lineStart) || null,
      lineEnd: typeof issue.lineEnd === 'number' ? issue.lineEnd : parseInt(issue.lineEnd) || null,
      explanation: issue.explanation || '',
      fixSuggestion: issue.fixSuggestion || '',
      improvedCode: issue.improvedCode || null
    };
  });
  
  return {
    score: Math.max(0, Math.min(100, score)),
    categories,
    issues
  };
};

// Base route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Code Review API Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, language, model = 'gemini-2.5-flash' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required for analysis.' });
    }

    const ai = getGeminiClient(req);

    // We request gemini-2.5-flash to analyze the code and return structured JSON
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

    const userPrompt = `Language: ${language || 'Auto-detect'}
Code to analyze:
\`\`\`
${code}
\`\`\``;

    // Create model client and generate content
    const modelClient = ai.getGenerativeModel({ 
      model: model || 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });
    const result = await modelClient.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { 
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    const cleaned = cleanJsonString(responseText);
    const report = JSON.parse(cleaned);
    const normalized = normalizeReport(report);
    
    res.json(normalized);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
  }
});

// AI Refactor / Rewrite API Endpoint
app.post('/api/refactor', async (req, res) => {
  try {
    const { code, language, instruction, model = 'gemini-2.5-flash' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required.' });
    }

    const ai = getGeminiClient(req);

    const systemInstruction = `You are CodeSage AI. Refactor the code according to the user instructions.
Improve readability, eliminate bugs, optimize performance, and keep syntax correct.
Return a JSON object containing the refactored code and an explanation.

Your response MUST match the following JSON structure:
{
  "refactoredCode": string,
  "explanation": string
}
Do not include markdown or backticks in the response. Return only the raw JSON.`;

    const userPrompt = `Language: ${language || 'Auto-detect'}
Instruction: ${instruction || 'Perform general optimization and refactoring.'}
Original Code:
\`\`\`
${code}
\`\`\``;

    const modelClient = ai.getGenerativeModel({ 
      model: model || 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });
    const result = await modelClient.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { 
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    const cleaned = cleanJsonString(responseText);
    const report = JSON.parse(cleaned);
    res.json(report);
  } catch (error) {
    console.error('Refactoring error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during refactoring.' });
  }
});

// GitHub API Integration: Fetch Repository Directory Tree
app.post('/api/github/contents', async (req, res) => {
  try {
    const { repoUrl, path = '' } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'GitHub Repository URL is required.' });
    }

    // Parse URL (e.g., https://github.com/username/repo or username/repo)
    let owner = '';
    let repo = '';
    
    const cleanUrl = repoUrl.replace('https://github.com/', '').replace('http://github.com/', '');
    const parts = cleanUrl.split('/');
    if (parts.length >= 2) {
      owner = parts[0];
      repo = parts[1].replace('.git', '');
    } else {
      return res.status(400).json({ error: 'Invalid GitHub URL format. Use "owner/repo" or full URL.' });
    }

    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    // Configure GitHub headers
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(githubApiUrl, { headers });
    
    // Map files for file tree view
    const items = response.data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type, // 'file' or 'dir'
      downloadUrl: item.download_url,
      size: item.size
    }));

    res.json({ owner, repo, path, items });
  } catch (error) {
    console.error('GitHub API error:', error.message);
    res.status(500).json({ 
      error: `Could not fetch GitHub repository contents: ${error.response?.data?.message || error.message}` 
    });
  }
});

// GitHub API Integration: Fetch File Content
app.post('/api/github/file', async (req, res) => {
  try {
    const { downloadUrl } = req.body;
    if (!downloadUrl) {
      return res.status(400).json({ error: 'Download URL is required.' });
    }

    const response = await axios.get(downloadUrl);
    
    // If response is object, stringify it (e.g., if JSON file), else send text
    const content = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
    
    res.json({ content });
  } catch (error) {
    console.error('GitHub file fetch error:', error);
    res.status(500).json({ error: `Could not download file content: ${error.message}` });
  }
});
// Serve frontend static files in production
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CodeSage AI Backend running on port ${PORT}`);
});
