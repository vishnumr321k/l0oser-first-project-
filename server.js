const app =  require('./index');
const env = require('dotenv').config();

const PORT = 3000 || process.env.PORT;

app.listen(PORT, () => {
    console.log('The server is started');
});