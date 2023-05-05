const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');

let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  execices : [{
    description: {type: String, required:true},
    duration: {type: Number, required:true},
    date: {type: String, required:true},
  }]
});

let User = mongoose.model('User', userSchema);

app.use(cors());

app.use('/api/users', bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').get(async function(req, res) {
  let users = await User.find({}).select({_id: true,username:true});
  res.json(users);
}).post(async function(req, res) {
 const username = req.body.username;
  //console.log(username);
  try {
    const newUser = new User({username:username});
    await newUser.save();
    res.json({username:newUser.username,_id:newUser._id});
  }
  catch (e) {
    console.log(e);
    res.status(500).json('Server error');
  }
})

app.post('/api/users/:_id/exercises', async function (req, res) {
  const userId = req.params._id;
  let user = await User.findById(userId);
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date?new Date(req.body.date).toDateString() : new Date().toDateString();
  user.execices?.push({
    description: description,
    duration: +duration,
    date: date
  })
  user = new User(user);
  try {
    const updatedUser = await user.save();
    res.json({ _id: userId, username: updatedUser.username, date: date, duration: +duration, description: description })
  }
  catch (e) {
    console.log(e);
    res.status(500).json('Server error!');
  }
})

app.get('/api/users/:_id/logs', async function (req,res) {
  const userId = req.params._id;
  try {
    let user = await User.findById(userId);
    const limit = req.query.limit;
    const from = req.query.from;
    const to = req.query.to;

    const dateFrom = new Date(from);
    const dateTo= new Date(to);
    

    let logs = user.execices;
    let response = { _id: userId, username: user.username};
    if (dateFrom.toString() !== 'Invalid Date') {
      logs = logs.filter(i=>new Date(i.date) >= dateFrom);
      response = {...response, from: dateFrom.toDateString()} 
    }
      
    if (dateTo.toString() !== 'Invalid Date') {
      logs = logs.filter(i=>new Date(i.date) <= dateTo);
       response = {...response, to: dateTo.toDateString()}
    }
      
    if (limit && !isNaN(limit)) {
      logs = logs.slice(0, +limit);
    }

    response = {...response, count: logs.length, log: logs}
    //console.log(limit,from,to,logs);
    res.json(response);
  }
  catch (e) {
    console.log(e);
    res.status(500).json('Server error!');
    
  }
  
  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})



exports.PersonModel = User;
