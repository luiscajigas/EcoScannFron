module.exports = (req, res) => {
  const apiUrl = (process.env.API_URL || 'https://ecoscannback.onrender.com/api')
    .trim()
    .replace(/\/+$/, '');

  let parsedUrl;
  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    return res.status(500).json({ error: 'API_URL no es una URL válida.' });
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    !parsedUrl.hostname ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash ||
    !parsedUrl.pathname.replace(/\/+$/, '').endsWith('/api')
  ) {
    return res.status(500).json({ error: 'API_URL debe ser HTTPS y terminar en /api.' });
  }

  return res.status(200).json({ apiUrl });
};
