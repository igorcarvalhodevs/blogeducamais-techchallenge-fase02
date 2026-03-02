const express = require('express');
const postRoutes = require('./modules/posts/post.routes');

const app = express();

app.use(express.json());

app.use('/posts', postRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
