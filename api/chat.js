// Vercel serverless function for ChatGPT API calls
module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, systemPrompt, conversationHistory = [], model = 'gpt-3.5-turbo', max_tokens = 200, temperature = 0.9 } = req.body;

        if (!message || !systemPrompt) {
            return res.status(400).json({ error: 'Message and systemPrompt are required' });
        }

        // Build messages array for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-8), // Keep last 8 messages for context
            { role: 'user', content: message }
        ];

        // Get API key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('API Key check:', apiKey ? 'Present' : 'Missing');
        
        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            console.error('OpenAI API key not configured properly');
            return res.status(500).json({ 
                error: 'OpenAI API key not configured. Please add your OpenAI API key to environment variables.',
                hint: 'Set OPENAI_API_KEY in Vercel dashboard or .env file'
            });
        }

        console.log('Sending to OpenAI:', {
            model,
            messageCount: messages.length,
            systemPrompt: messages[0]?.content?.substring(0, 100) + '...',
            userMessage: message,
            max_tokens,
            temperature
        });

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenAI API Error:', error);
            return res.status(response.status).json({ 
                error: 'OpenAI API error',
                details: error
            });
        }

        const data = await response.json();
        
        // Return the AI response
        res.status(200).json({
            response: data.choices[0].message.content,
            usage: data.usage
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}