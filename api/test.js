// Test endpoint to check API configuration
module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Check environment variables
        const apiKey = process.env.OPENAI_API_KEY;
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            hasApiKey: !!apiKey,
            keyStart: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET',
            keyLength: apiKey ? apiKey.length : 0,
            environment: process.env.NODE_ENV || 'unknown',
            vercelEnv: process.env.VERCEL_ENV || 'unknown'
        };

        // Test a simple OpenAI API call
        if (apiKey && apiKey !== 'your_openai_api_key_here') {
            try {
                const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'user', content: 'Say "API test successful"' }
                        ],
                        max_tokens: 10
                    })
                });

                diagnostics.apiTest = {
                    status: testResponse.status,
                    statusText: testResponse.statusText,
                    ok: testResponse.ok
                };

                if (testResponse.ok) {
                    const data = await testResponse.json();
                    diagnostics.apiTest.response = data.choices[0]?.message?.content || 'No response';
                } else {
                    const errorText = await testResponse.text();
                    diagnostics.apiTest.error = errorText;
                }
            } catch (apiError) {
                diagnostics.apiTest = {
                    error: apiError.message,
                    type: 'network_error'
                };
            }
        } else {
            diagnostics.apiTest = {
                error: 'API key not configured or invalid',
                type: 'missing_key'
            };
        }

        res.status(200).json({
            success: true,
            diagnostics
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            diagnostics: {
                timestamp: new Date().toISOString(),
                hasApiKey: !!process.env.OPENAI_API_KEY,
                error: 'Server error during diagnostics'
            }
        });
    }
}