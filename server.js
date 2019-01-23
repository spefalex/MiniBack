// =======================
// tout les packages ============
// =======================
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");
var multer  = require('multer');
var path = require('path');
var fs = require('fs');
var jwt = require("jsonwebtoken"); // géerer token
var config = require("./config"); // config ny back
var User = require("./app/models/user"); // modele the entity

// =======================
// configuration =========
// =======================
var port = 8888; // utilisé pour créer, signer et vérifier les jetons
mongoose.connect(config.database); // connect to database
app.set("superSecret", config.secret); // secret variable

// utiliser un analyseur de corps pour obtenir des informations à partir des paramètres POST et / ou URL
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// utiliser morgan pour consigner les requêtes sur la console
app.use(morgan("dev"));

// =======================
// routes ================
// =======================
// basic route
app.get("/", function(req, res) {
  res.send("port " + port + "/api");
});
//sample user
app.get("/setup", function(req, res) {
  // create a sample user
  var nick = new User({
    name: "Hasina Spexe 2",
    password: "password",
    avatar:"",
    admin: true,
    createdAt: Date.now()
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log("Utilisateur enregistré avec succès");
    res.json({ success: true });
  });
});

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init i
const upload = multer({
  storage: storage,
  //limits:{fileSize: 1000000},
//  fileFilter: function(req, file, cb){
   // checkFileType(file, cb);
//  }
}).single('avatar');

// Check File Type
function checkFileType(file, cb){

  console.log(file)
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}


app.post("/insert",function(req, res) {
  upload(req, res, (err) => {
    if(err){
      console.log(err)
    } else {
      if(req.file == undefined){
  
        console.log("undefind")
      } else {
        console.log("valueqq",req.body.name);
     
       res.json({'filename':req.file.path})
      }
    }
  });
});
// ROUTES DE L'API -------------------

// récupère une instance du routeur pour les routes api
var apiRoutes = express.Router();

// route pour authentifier un utilisateur (POST http: // localhost: 8080 / api / authenticate)

// routage du middleware pour vérifier un token
apiRoutes.use(function(req, res, next) {
  // vérifier les paramètres d'en-tête ou d'URL ou publier des paramètres pour le token
  var token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  // decode token
  if (token) {
    // vérifie le secret et vérifie exp
    jwt.verify(token, app.get("superSecret"), function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: "Échec de l'authentification du token."
        });
      } else {
        // si tout va bien, enregistrez-le pour demander son utilisation sur d'autres routes
        req.decoded = decoded;

        console.log(decoded);
        next();
      }
    });
  } else {
    // s'il n'y a pas de token
    // retourne une erreur
    return res.status(403).send({
      success: false,
      message: "Aucun token fourni."
    });
  }
});

app.use("/api", apiRoutes);
//route pour afficher un message aléatoire (GET http: // localhost: 8080 / api /)
apiRoutes.get("/", function(req, res) {
  res.json({ message: "Bienvenue ;) " });
});

// route pour renvoyer tous les utilisateurs (GET http: // localhost: 8080 / api / users)
apiRoutes.get("/users", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  User.find({}, function(err, users) {
    res.json(users);
  });
});

app.post("/authenticate", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  // trouver user
  User.findOne(
    {
      name: req.body.name
    },
    function(err, user) {
      if (err) throw err;

      if (!user) {
        res.json({
          success: false,
          message: "Échec de l'authentification.Utilisateur introuvable"
        });
      } else if (user) {
        console.log(user);
        // verification du password
        if (user.password != req.body.password) {
          res.json({
            success: false,
            message: "Échec de l'authentification Mot de passe incorrect."
          });
        } else {
          // si l'utilisateur est trouvé et que le mot de passe est correct
          // créer token

          const payload = {
            admin: user._id
          };
          var token = jwt.sign(payload, app.get("superSecret"), {
            expiresIn: 60 * 60 * 24
          });
          console.log(payload);
          // return l'information avec le token
          res.json({
            success: true,
            message: "bien authentifié",
            token: token
          });
        }
      }
    }
  );
});
app.post("/inscription", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var nick = new User({
    name: req.body.name,
    password: req.body.password,
    avatar:"",
    admin: true,
    createdAt: Date.now()
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log("Utilisateur enregistré avec succès");
    res.json({ success: true });
  });
 
});

app.listen(port);
console.log("server run in " + port);
