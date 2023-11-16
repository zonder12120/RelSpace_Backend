const express = require('express');
const cors = require('cors');
const routes = require('./routes/routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200'
}));

app.use('/api', routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
