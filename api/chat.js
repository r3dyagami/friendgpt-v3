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
        const { message, systemPrompt, conversationHistory = [], model = 'gpt-3.5-turbo', max_tokens = 150, temperature = 0.9 } = req.body;

        if (!message || !systemPrompt) {
            return res.status(400).json({ error: 'Message and systemPrompt are required' });
        }

        // Build messages array for OpenAI with word limit instruction
        const wordLimitPrompt = systemPrompt + " Keep responses under 100 words and always complete your sentences properly.";
        const messages = [
            { role: 'system', content: wordLimitPrompt },
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
        
        // Process response to ensure word limit and sentence completion
        let aiResponse = data.choices[0].message.content;
        
        // Count words and limit to 100
        const words = aiResponse.split(/\s+/);
        if (words.length > 100) {
            // Find last complete sentence within 100 words
            const truncated = words.slice(0, 100).join(' ');
            const lastSentenceEnd = Math.max(
                truncated.lastIndexOf('.'),
                truncated.lastIndexOf('!'),
                truncated.lastIndexOf('?')
            );
            
            if (lastSentenceEnd > truncated.length * 0.7) {
                // If we have a good sentence ending point, use it
                aiResponse = truncated.substring(0, lastSentenceEnd + 1);
            } else {
                // Otherwise, add ellipsis to indicate continuation
                aiResponse = truncated + '...';
            }
        }
        
        // Return the AI response
        res.status(200).json({
            response: aiResponse,
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