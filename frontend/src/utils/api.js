import { GoogleGenerativeAI } from '@google/generative-ai';

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

const getGeminiClient = (apiKeyOverride = '') => {
  // Check override first, then check Vite environment variable
  const apiKey = apiKeyOverride || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please enter it in the settings modal (gear icon).');
  }
  return new GoogleGenerativeAI(apiKey);
};

export const api = {
  /**
   * Check health (Client side always ok)
   */
  async checkHealth() {
    return { status: 'ok', clientSide: true };
  },

  /**
   * Request AI code review analysis directly from browser
   */
  async analyzeCode(code, language, apiKeyOverride = '') {
    try {
      const ai = getGeminiClient(apiKeyOverride);
      
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

      const modelClient = ai.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction
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
      return normalizeReport(report);
    } catch (error) {
      console.error('Client analysis error:', error);
      throw new Error(error.message || 'An error occurred during analysis.');
    }
  },

  /**
   * Request AI code refactoring directly from browser
   */
  async refactorCode(code, language, instruction, apiKeyOverride = '') {
    try {
      const ai = getGeminiClient(apiKeyOverride);
      
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
        model: 'gemini-2.5-flash',
        systemInstruction
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
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Client refactoring error:', error);
      throw new Error(error.message || 'An error occurred during refactoring.');
    }
  },

  /**
   * Fetch contents of a GitHub repository directory directly from browser
   */
  async getGithubContents(repoUrl, path = '') {
    try {
      let owner = '';
      let repo = '';
      
      const cleanUrl = repoUrl.replace('https://github.com/', '').replace('http://github.com/', '');
      const parts = cleanUrl.split('/');
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1].replace('.git', '');
      } else {
        throw new Error('Invalid GitHub URL format. Use "owner/repo" or full URL.');
      }

      const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      
      const response = await fetch(githubApiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      const items = data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type, // 'file' or 'dir'
        downloadUrl: item.download_url,
        size: item.size
      }));

      return { owner, repo, path, items };
    } catch (error) {
      console.error('Client GitHub API error:', error);
      throw new Error(`Could not fetch GitHub repository contents: ${error.message}`);
    }
  },

  /**
   * Fetch text content of a GitHub repository file directly from browser
   */
  async getGithubFile(downloadUrl) {
    try {
      if (!downloadUrl) {
        throw new Error('Download URL is required.');
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const text = await response.text();
      return { content: text };
    } catch (error) {
      console.error('Client GitHub file fetch error:', error);
      throw new Error(`Could not download file content: ${error.message}`);
    }
  }
};
