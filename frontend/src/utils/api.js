/**
 * API client for CodeSage AI
 */

const API_BASE = '/api';

/**
 * Gets request headers, appending API key override if present
 */
const getHeaders = (apiKeyOverride = '') => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKeyOverride) {
    headers['x-api-key'] = apiKeyOverride;
  }
  return headers;
};

export const api = {
  /**
   * Check health of backend API
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error('API server is not responding');
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  /**
   * Request AI code review analysis
   */
  async analyzeCode(code, language, apiKeyOverride = '') {
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: getHeaders(apiKeyOverride),
        body: JSON.stringify({ code, language }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze code');
      }
      return data;
    } catch (error) {
      console.error('Analysis API error:', error);
      throw error;
    }
  },

  /**
   * Request AI code refactoring
   */
  async refactorCode(code, language, instruction, apiKeyOverride = '') {
    try {
      const response = await fetch(`${API_BASE}/refactor`, {
        method: 'POST',
        headers: getHeaders(apiKeyOverride),
        body: JSON.stringify({ code, language, instruction }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refactor code');
      }
      return data;
    } catch (error) {
      console.error('Refactoring API error:', error);
      throw error;
    }
  },

  /**
   * Fetch contents of a GitHub repository directory
   */
  async getGithubContents(repoUrl, path = '') {
    try {
      const response = await fetch(`${API_BASE}/github/contents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, path }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repository files');
      }
      return data;
    } catch (error) {
      console.error('GitHub contents API error:', error);
      throw error;
    }
  },

  /**
   * Fetch text content of a GitHub repository file
   */
  async getGithubFile(downloadUrl) {
    try {
      const response = await fetch(`${API_BASE}/github/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to download file content');
      }
      return data;
    } catch (error) {
      console.error('GitHub file API error:', error);
      throw error;
    }
  }
};
