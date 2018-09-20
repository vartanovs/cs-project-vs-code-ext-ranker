const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const sqlite = require('sqlite');
const path = require('path');

const app = express();
const dbPromise = sqlite.open('./database.db', { Promise });

app.set('view engine', 'ejs');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const saltRounds = 10;

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

// Route for registration form
app.get('/form.html', (req, res) => {
  res.sendFile(path.join(__dirname + '/form.html'));
});

// Route for login.html to confirm login success
app.post('/login.html', urlencodedParser, async (req, res, next) => {
  // Cache email address and password
  const logInAcct = req.body.account;
  const logInPass = req.body.pass;
  try {
    const db = await dbPromise;
    // Query all user accounts from database, cache in userArray
    const userArray = await Promise.all(db.all('SELECT * FROM user_table'));
    // Loop through accounts to confirm if user/pass combination is available
    userArray.forEach(async (user) => {
      if (user.email === logInAcct && bcrypt.compareSync(logInPass, user.hash_pass)) {
        // If combination found, pull extension list
        const extArray = await Promise.all(db.all(`SELECT * FROM vsc_ext_table WHERE user_id="${user.user_id}"`));
        res.render('extList', { user, extArray });
      }
    });
    res.sendFile(path.join(__dirname + '/newlogin.html'));
  } catch (err) {
    next(err);
  }
});

// Route for new login css file
app.get('/newlogin.css', (req, res) => {
  res.sendFile(path.join(__dirname + '/newlogin.css'));
});

// Route for login.html to confirm login success
app.post('/register.html', urlencodedParser, async (req, res, next) => {
  // Cache registration inputs
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const email = req.body.email;
  const pass = req.body.pass;
  const hashPass = bcrypt.hashSync(pass, saltRounds);
  try {
    const db = await dbPromise;
    // Query all user accounts from database, cache in userArray
    await Promise.all(db.all(`INSERT INTO user_table (first_name, last_name, email, hash_pass) VALUES ('${firstName}', '${lastName}', '${email}', '${hashPass}');`));
    let user = await Promise.all(db.all(`SELECT * FROM user_table WHERE email='${email}';`));
    user = user[0]
    console.log(user);
    res.render('extList', { user });
  } catch (err) {
    next(err);
  }
});

// Route for adding a new Extension
app.post('/addExt.html', urlencodedParser, async (req, res, next) => {
  // Cache extension inputs
  const userID = req.body.userID;
  const extName = req.body.extName;
  const extURL = req.body.extURL;
  try {
    const db = await dbPromise;
    // Insert new extension into extention table
    await Promise.all(db.all(`INSERT INTO vsc_ext_table (user_id, vsc_ext_name, vsc_ext_url) VALUES ('${userID}', '${extName}', '${extURL}');`));
    const extArray = await Promise.all(db.all(`SELECT * FROM vsc_ext_table WHERE user_id="${userID}"`));
    let user = await Promise.all(db.all(`SELECT * FROM user_table WHERE user_id='${userID}';`));
    user = user[0];
    res.render('extList', { user, extArray });
  } catch (err) {
    next(err);
  }
});

app.listen(3000, () => {
  console.log('Server Started on Port 3000');
});
