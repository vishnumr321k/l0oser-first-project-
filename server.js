const app = require('./index');


const PORT = process.env.PORT;

app.listen(PORT, () => {
console.log('The Admin side :- http://localhost:3000/admin/signin');
console.log('The User side :- http://localhost:3000/home');
});