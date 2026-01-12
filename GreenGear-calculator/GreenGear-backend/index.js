const express = require('express');
const app = express();
const PORT = 3000;
const materialsRouter = require('./routes/materials')
const gearboxRouter = require('./routes/gearbox')
const lifecycleRouter = require('./routes/lifecycle')
const evaluationRouter = require('./routes/evaluation')
const userRouter = require('./routes/user');
const cors = require('cors');

app.use(cors({
  credentials: true
}));
// Behind Nginx, trust proxy headers so req.ip and rate limit work
app.set('trust proxy', 1);
app.use(express.json());

app.use("/api/v1", materialsRouter);
app.use("/api/v1", gearboxRouter);
app.use("/api/v1", lifecycleRouter);
app.use("/api/v1", evaluationRouter);
app.use("/api/v1", userRouter);

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(PORT, () => {
  console.log('Server is running on port: ', PORT);
});

