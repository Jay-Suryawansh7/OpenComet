/**
 * OpenComet Proxy Server
 * Lightweight Express server for LLM API proxying (handles CORS)
 */

import express from 'express';

const app = express();
const PORT = process.env.PROXY_PORT || 8765;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'opencomet-proxy', timestamp: Date.now() });
});

app.post('/api/proxy/chat', async (req, res) => {
  try {
    const { baseUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 4096 } = req.body;

    if (!baseUrl || !messages) {
      return res.status(400).json({ error: 'Missing baseUrl or messages' });
    }

    const isAnthropic = baseUrl.includes('anthropic');
    let requestBody;

    if (isAnthropic) {
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      requestBody = {
        model: model || 'claude-sonnet-4-20250514',
        messages: conversationMessages,
        system: systemMessage?.content,
        max_tokens: maxTokens,
        temperature,
      };
    } else {
      requestBody = {
        model: model || 'gpt-4o',
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
      };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.post('/api/tools/web-search', async (req, res) => {
  try {
    const { query, numResults = 5 } = req.body;

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Search failed' });
    }

    const html = await response.text();
    const results = parseSearchResults(html);

    res.json({
      success: true,
      query,
      results,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({ error: 'Web search failed' });
  }
});

app.post('/api/tools/browse', async (req, res) => {
  try {
    const { url, maxLength = 5000 } = req.body;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch URL' });
    }

    const html = await response.text();
    const title = extractTitle(html);
    const content = extractContent(html);
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength) + '...[truncated]'
      : content;

    res.json({
      success: true,
      url,
      title,
      content: truncated,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Browse error:', error);
    res.status(500).json({ error: 'Browse failed' });
  }
});

app.post('/api/tools/execute-code', async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (language === 'javascript' || language === 'js') {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      try {
        const result = eval(code);
        console.log = originalLog;
        res.json({
          success: true,
          output: logs.join('\n'),
          result: result !== undefined ? String(result) : undefined,
          language,
        });
      } catch (error) {
        console.log = originalLog;
        res.json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          language,
        });
      }
    } else {
      res.json({
        success: false,
        error: `Language ${language} not supported in browser sandbox. Use JavaScript.`,
        language,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Code execution failed' });
  }
});

app.get('/api/providers', (req, res) => {
  const providers = [
    { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com' },
    { id: 'google', name: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com' },
    { id: 'nvidia', name: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1' },
    { id: 'ollama', name: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1' },
  ];
  res.json({ providers });
});

function parseSearchResults(html) {
  const results = [];
  const titles = html.match(/<a href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/g) || [];
  
  for (const match of titles.slice(0, 10)) {
    const urlMatch = match.match(/href="(https?:\/\/[^"]+)"/);
    const titleMatch = match.match(/>([^<]+)<\/a>/);
    
    if (urlMatch && titleMatch) {
      const url = urlMatch[1];
      const title = titleMatch[1];
      
      if (url.includes('google') || url.includes('aclk')) continue;
      
      results.push({
        title,
        url,
        snippet: '',
      });
    }
  }
  
  return results.slice(0, 5);
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1] : 'Untitled';
}

function extractContent(html) {
  const withoutScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  const withoutStyles = withoutScripts.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  const withoutTags = withoutStyles.replace(/<[^>]+>/g, ' ');
  const cleaned = withoutTags.replace(/\s+/g, ' ').trim();
  return cleaned;
}

app.listen(PORT, () => {
  console.log(`OpenComet Proxy Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  POST /api/proxy/chat - Proxy LLM requests');
  console.log('  POST /api/tools/web-search - Web search');
  console.log('  POST /api/tools/browse - Browse URL');
  console.log('  POST /api/tools/execute-code - Execute JS code');
  console.log('  GET  /api/providers - List providers');
});

export default app;
