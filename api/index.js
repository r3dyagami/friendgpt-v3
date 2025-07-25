module.exports = (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    endpoints: {
      '/api': 'This endpoint',
      '/api/hello': 'Simple hello endpoint',
      '/api/test': 'API diagnostics',
      '/api/chat': 'ChatGPT integration'
    }
  });
};