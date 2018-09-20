const express = require('express');
const Promise = require('bluebird');
const sqlite = require('sqlite');

const app = express();
const dbPromise = sqlite.open('./database.db', { Promise });

app.set('view engine', 'ejs');

console.log(dbPromise);

// Route for '/' to enable index
app.get('/', async (req, res, next) => {
  try {
    const db = await dbPromise;
    const [user, vscExt] = await Promise.all([
      // db.all('INSERT INTO vsc_ext_table (record_id, user_id, vsc_ext_url) VALUES (3, 3, "value");'),
      db.all('SELECT * FROM user_table'),
      db.all('SELECT * FROM vsc_ext_table'),
    ]);
    console.log('test', user, vscExt);
    res.render('index', { user, vscExt });
  } catch (err) {
    next(err);
  }
});

app.listen(3000, () => {
  console.log('Server Started on Port 3000');
});
