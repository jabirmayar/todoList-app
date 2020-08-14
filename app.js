const express = require("express");
const session = require('express-session');
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();
app.use(session({
  secret: 'nosecrets',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');
mongoose.set('useCreateIndex', true);
const dbUrl = "mongodb+srv://kilarikhan1:Kilarikhan1@cluster0.yjitc.azure.mongodb.net/todolistDB?retryWrites=true&w=majority";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// to get Date
let today = new Date();
let options = {
  weekday: "long",
  day: "numeric",
  month: "long"
};
let day = today.toLocaleDateString("en-US", options);


var userSession;

const itemsSchema = {
  name: String,
  userID: String
};

let Item = mongoose.model("todo", itemsSchema);

const defaultItemSchema = {
  name: String
};

let defaultItem = mongoose.model("defaultitem", defaultItemSchema);


const usersSchema = {
  username: {
    type: String,
    unique: true
  },
  email: String,
  password: String
};

const User = mongoose.model("user", usersSchema);


app.get("/", function(req, res) {

  userSession = req.session;

if(userSession.logged){
    Item.find({
      userID: userSession.userID
    }, function(err, foundItems) {
      if(err) return console.log(err);
      res.render("list", {
        logged: userSession.logged,
        name: userSession.username,
        kindOfDay: day,
        newListItems: foundItems
      });
      });
}
else{
  defaultItem.find({}, function(err, item){
    res.render("list", {
      logged: userSession.logged,
      name: userSession.username,
      kindOfDay: day,
      newListItems: item
    });
  });
}


});



app.post("/", function(req, res) {



  let newItem = req.body.newItem;

  userSession = req.session;

  if (userSession.logged) {
    let item = new Item({
      name: newItem,
      userID: userSession.userID
    });
    item.save(function(err) {

      if (err) return console.log(err);

      res.redirect("/");
    });

  } else {
    defaultItem.find({}, function(err, item){
      res.render("list", {
        logged: userSession.logged,
        name: userSession.username,
        kindOfDay: day,
        newListItems: item
      });
    });
  }


});



app.post("/delete", function(req, res) {

  let deleteTask = req.body.check;

  Item.findByIdAndRemove(deleteTask, function(err) {
    res.redirect("/");
  });


});



app.get("/login", function(req, res) {
if(userSession.logged){
  res.redirect("/");
}
else if(!userSession.logged){
  res.render("login", {
    error: "",
    userN: "",
    password: ""
  });
}
});

app.post("/login", function(req, res) {
  const username = req.body.username.toString().toLowerCase();
  const password = md5(req.body.password);

  User.findOne({username: username}, function(err, user) {

    if (err) return res.render("login", {
      error: "User not found",
      userN: username,
      password: password
    });

    if(user){
      if (user.password !== password) {
        res.render("login", {
          error: "Incorrect password!",
          userN: username,
          password: []
        });
      } else if (user.password === password){
          userSession = req.session;
          userSession.username = username;
          userSession.logged = true;
          userSession.userID = user._id;
          req.session.save();
          res.redirect("/");
      }
    }


    });

  });



app.get("/signup", function(req, res) {
  if(userSession.logged){
    res.redirect("/");
  }
  else if(!userSession.logged){
  res.render("signup", {
    UserName: "",
    userN: "",
    email: "",
    password: ""
  });
}
});

app.post("/signup", function(req, res) {

  const username = req.body.username.toString().toLowerCase();
  const email = req.body.email;
  const password = md5(req.body.password);

  User.findOne({username: username}, function(err, user) {

    if ( err) return res.render("signup", {
      UserName: "An error occured while Signing Up!",
      userN: username,
      email: email,
      password: password
    });

    if (user) {
          res.render("signup", {
            UserName: "Username is already taken. Please choose another username!",
            userN: username,
            email: email,
            password: password
          });
        }
     else {
      let newuser = new User({
        username: username,
        email: email,
        password: password
      });

      newuser.save(function(err) {
        if (err) { res.render("signup", {
          UserName: "An error occured while Signing Up!",
          userN: username,
          email: email,
          password: password
        });
      }else{
        res.redirect("/login");
      }

      });


    }

  });

});



app.post("/logout", function(req, res) {
  req.session.destroy();

  res.redirect("/");

});



app.listen(process.env.PORT || 3000, function(req, res) {

  console.log("Server is listening to port: 3000");

});
