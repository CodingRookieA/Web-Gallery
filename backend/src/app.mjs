//This file is modified from todo item of week 5 lecture of CSCC09
import { rmSync } from "fs";
import { genSalt, hash } from "bcrypt";
import { createServer } from "http";
import express from "express";
import Datastore from "@seald-io/nedb";
import session from "express-session";
import { serialize } from "cookie";
import { resolve } from "path";
import multer from "multer";
import validator from "validator";
import 'dotenv/config';


const PORT = 3000;
const app = express();
app.set('trust proxy', 1);

const upload = multer({ dest: resolve("uploads") });

app.use(express.json());

const users = new Datastore({ filename: "db/users.db", autoload: true, timeStamp: true });
const images = new Datastore({ filename: 'db/images.db', autoload: true, timestampData: true });
const comments = new Datastore({ filename: 'db/comments.db', autoload: true, timestampData: true });


app.use(function (req, res, next) {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

// development: use express to serve frontend files
// production: use a dockerized nginx to serve frontend files
if (process.env.NODE_ENV == "dev") app.use(express.static('../../frontend/src'));

export const server = createServer(app).listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});


app.use(session({
  secret: process.env.SESSION_SECRET, // make sure to change the secret in the .env file
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: true,
    secure: process.env.NODE_ENV == "prod", // sets the secure flag only with HTTPS in production 
  }
}));

app.use(function (req, res, next) {
  const username = req.session.user ? req.session.user._id : "";
  res.setHeader(
    "Set-Cookie",
    serialize("username", username, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
    }),
  );
  next();
});

const checkUsername = function (req, res, next) {
  if (!validator.isAlphanumeric(req.body.username)) return res.status(400).end("bad input");
  next();
};

app.post('/api/signup', upload.none(), checkUsername, function (req, res, next) {
  // extract data from HTTP request
  if (!('username' in req.body)) return res.status(400).end('username is missing');
  if (!('password' in req.body)) return res.status(400).end('password is missing');
  var username = req.body.username;
  var password = req.body.password;
  // check if user already exists in the database
  users.findOne({ _id: username }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (user) return res.status(409).end("username " + username + " already exists");
    // generate a new salt and hash
    genSalt(10, function (err, salt) {
      hash(password, salt, function (err, hash) {
        // insert new user into the database
        users.update({ _id: username }, { _id: username, hash: hash, salt: salt }, { upsert: true }, function (err) {
          if (err) return res.status(500).end(err);
          return res.json(hash);
        });
      });
    });
  });
});

// curl -X POST -d "username=admin&password=pass4admin" -c cookie.txt http://localhost:3000/signin/
app.post('/api/signin', upload.none(), checkUsername, function (req, res, next) {
  // extract data from HTTP request
  if (!('username' in req.body)) return res.status(400).end('username is missing');
  if (!('password' in req.body)) return res.status(400).end('password is missing');
  var username = req.body.username;
  var password = req.body.password;
  // retrieve user from the database
  users.findOne({ _id: username }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (!user) return res.status(401).end("User do not exsist");

    // Use the stored salt to hash the entered password
    hash(password, user.salt, function (err, hash) {
      if (err) return res.status(500).end(err);

      if (hash !== user.hash) return res.status(401).end("Wrong password");

      // Password correct, start session
      req.session.user = user;
      res.setHeader('Set-Cookie', serialize('username', user._id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }));
      return res.json({ message: "Signed in" });
    });
  });
});

// curl -b cookie.txt -c cookie.txt http://localhost:3000/signout/
app.get('/api/signout', function (req, res, next) {
  req.session.destroy();
  res.setHeader('Set-Cookie', serialize('username', '', {
    path: '/',
    maxAge: 0
  }));
  return res.json({ message: "Logged out" });
});

//From now on, all requests are open to logged in users only
app.use(function (req, res, next) {
  if (!req.session.user) {
    return res.status(401).end("access denied, sign in first");
  }
  next();
})


//Get all users
app.get("/api/users", upload.none(), function (req, res) {
  const currentUser = req.session.user._id;

  images.find({}, (err, images) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    const allAuthors = images.map(img => img.author);

    const uniqueAuthors = [...new Set(allAuthors)];

    const index = uniqueAuthors.indexOf(currentUser);
    if (index > -1) {
      uniqueAuthors.splice(index, 1);
    }

    if (currentUser) {
      uniqueAuthors.unshift(currentUser);
    }

    res.json(uniqueAuthors);
  });
});

// Create image
app.post("/api/images/", upload.single("picture"), (req, res) => {
  const author = req.session.user._id;
  const title = req.body.title;


  images.insert({
    author,
    title,
    profile: req.file
  }, (err, newImage) => {
    if (err) return res.status(500).send(err);
    res.json(newImage);
  });

});

//Get image according to its id
app.get('/api/images/:imageId/', function (req, res, next) {
  const imageId = req.params.imageId;

  images.findOne({ _id: imageId }, (err, doc) => {
    if (err) return res.status(500).send(err);
    if (!doc) return res.status(404).end('image ' + imageId + ' does not exists');

    const profile = doc.profile;
    if (!profile) return res.status(404).send('Image ' + imageId + ' has no corresponding file');
    res.setHeader('Content-Type', profile.mimetype);
    res.sendFile(profile.path);
  });
});

//Return image metadata
app.get("/api/images/", function (req, res, next) {
  const skip = parseInt(req.query.skip);
  const limit = parseInt(req.query.limit);
  const author = req.query.author;

  images.find({ author: author })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .projection({ _id: 1, createdAt: 1, author: 1, title: 1 })
    .exec(function (err, docs) {
      if (err) return res.status(500).send(err);

      res.json(docs);
    })
})


//This function is modified from https://www.w3schools.com/nodejs/nodejs_filesystem.asp
function deleteFile(filepath) {

  try {
    if (filepath) {
      rmSync(filepath, { force: true });
      return 1;
    }
  } catch (err) {
    console.error("Failed to delete image file:", err);
    return 0;
  }
}


//Delete an image
app.delete(`/api/images/:imageId/`, function (req, res, next) {
  const imageId = req.params.imageId;
  const user = req.session.user._id;

  images.findOne({ _id: imageId }, function (err, image) {
    if (err) return res.status(500).send(err);

    if (!image) return res.status(404).send("Image not found");

    if (image.author != user) {
      return res.status(403).send("only creator of the image can delete it");
    } else {
      //First delete the image from upload folder
      const filePath = image.profile.path;
      console.log(filePath);

      let result = deleteFile(filePath);

      if (result != 1) {
        return res.status(500).send("Problem removing file local upload folder");
      }

      //Now remove the refrence from the db
      images.remove({ _id: imageId }, {}, (err, numRemoved) => {
        if (err) return res.status(500).send(err);
        if (numRemoved === 0) return res.status(404).send("Image not found");

        comments.remove({ imageId: imageId }, {}, (err, cmt_numRemoved) => {
          if (err) return res.status(500).send(err);
          res.json({
            _id: imageId,
            images: numRemoved,
            comments: cmt_numRemoved
          });
        })
      });
    }
  })
});

//Create comment
app.post("/api/comments/", upload.none(), function (req, res, next) {

  const message = {
    imageId: req.body.imageId,
    content: req.body.content,
    author: req.session.user._id,
  };

  comments.insert(message, (err, newMsg) => {
    if (err) return res.status(500).send(err);
    res.json(newMsg);
  });
});

//Get comments
app.get("/api/comments/:imageId/", function (req, res, next) {
  const id = req.params.imageId;

  const skip = parseInt(req.query.skip);

  comments.find({ imageId: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(10)
    .projection({ _id: 1, imageId: 1, content: 1, author: 1, createdAt: 1 })
    .exec(function (err, docs) {
      if (err) res.status(500).send(err);

      res.json(docs);
    })
})


// Delete comment
app.delete("/api/comments/:id/", function (req, res, next) {
  const { id } = req.params;

  const user = req.session.user._id;

  comments.findOne({ _id: id }).exec(function (err, docs) {
    if (err) return res.status(500).send(err);
    if (docs.author != user) {
      images.findOne({ _id: docs.imageId }).exec(function (err, image) {
        if (err) return res.status(500).send(err);
        if (image.author != user) {
          return res.status(403).send("Only commenter or creator of the image can delete this comment");
        } else {
          comments.remove({ _id: id }, {}, (err, numRemoved) => {
            if (err) return res.status(500).send(err);
            if (numRemoved === 0) return res.status(404).send("Message not found");
            res.json({ _id: id });
          });
        }
      });
    } else {
      comments.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) return res.status(500).send(err);
        if (numRemoved === 0) return res.status(404).send("Message not found");
        res.json({ _id: id });
      });
    }
  })
});

