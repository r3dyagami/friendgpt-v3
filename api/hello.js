module.exports = function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello from Vercel!',
    timestamp: new Date().toISOString(),
    method: req.method,
    env: {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      nodeVersion: process.version
    }
  });
}