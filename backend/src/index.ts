import express from 'express';

const app = express();
const port = process.env.BACKEND_PORT;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript Express!');
});

app.get('/api/test', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

export default app;