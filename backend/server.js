
const express = require('express');
const app = express();

const bcrypt = require('bcrypt');

const cors = require('cors');
const bodyparser = require('body-parser');

const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
app.use(cookieParser('maThIs273'));

const nodemailer = require('nodemailer');

const port = 3000;

const url = 'mongodb+srv://mathisfriess:L4HEfJzdFX7tcgKI@dragonshop.9wodojn.mongodb.net/?retryWrites=true&w=majority&appName=DragonShop';
const { MongoClient } = require('mongodb');
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = client.db("dragonshop");
const usersCollection = db.collection('users');

// L4HEfJzdFX7tcgKI

app.use(cors( { origin: `http://localhost:4200`, credentials: true } ));
app.use(bodyparser.json());


async function newUserId() {
  return uuidv4().toString();
}

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10)
          .then(hashedPassword => {
              resolve(hashedPassword); // Résoudre la promesse avec le hachage
          })
          .catch(err => {
              console.error('Erreur lors de la génération du hachage :', err);
              reject(err); // Rejeter la promesse en cas d'erreur
          });
  });
}

async function asyncSearch(request) {
  return db.command(request);
}

app.get("/users/search/:filter/:field", async (req, res) => {
  const filter = req.params.filter;
  const field = req.params.field;
  console.log(filter);
  console.log(field);

  const request = {
    find:"users",
    filter:{[filter]:field}
  };
  const rep = await asyncSearch(request);

  const documents = rep.cursor.firstBatch;
  const resTab = [];

  documents.forEach((doc, index) => {
    console.log(`Document ${index + 1}:`, doc);
    resTab.push(doc);
  });

  if(resTab[0] != undefined) {
    res.send(resTab);
    console.log(resTab);
  } else {
    res.status(204).end();
  }
});

app.post('/signup', async (req, res) => {
  console.log(req.body);

  const request = {
    find:"users",
    filter:{mail:req.body.mail}
  };

  var rep = await asyncSearch(request);
  rep = rep.cursor.firstBatch[0];
  console.log(rep);

  if(rep != undefined) {
    res.status(400).end();
    return;
  }

  const hashedPassword = await hashPassword(req.body.password);
  const userId = await newUserId();
  console.log(userId);

  const newuser = {
    "name" : req.body.name,
    "lastname" : req.body.lastname,
    "mail": req.body.mail,
    "password": hashedPassword,
    "userId": userId
  }

  insertdb(usersCollection, newuser);

  res.status(200).json({ message: 'Inscription réussie', userId: userId});
});


app.post('/login', async (req, res) => {
  console.log(req.body);

  const passwordAttempt = await req.body.password;
  const mail = await req.body.mail;
  
  const request = {
    find:"users",
    filter:{mail:mail}
  };

  var rep = await asyncSearch(request);
  console.log(rep.cursor.firstBatch);
  rep = rep.cursor.firstBatch[0];
  if(rep == undefined) {
    console.log("Aucun mail ne correspond");
    res.status(205).end();
    return;
  }
  console.log(rep)
  const passwordBdd = rep.password;

  console.log("attempt: "+passwordAttempt);
  console.log("bdd: "+passwordBdd);

  bcrypt.compare(passwordAttempt, passwordBdd)
    .then(async match => {
        if (match) {
          const userId = await newUserId();
          udpateDb(usersCollection, "mail", mail, "userId", userId);
          console.log('Mot de passe correct. Connexion réussie.');
          res.status(200).json({message:"Connexion reussie", userId:userId});
        } else {
          console.log('Mot de passe incorrect. Connexion échouée.');
          res.status(204).end();
        }
    })
    .catch(err => console.error('Erreur lors de la comparaison des mots de passe :', err));


  //res.status(200).json({ message: 'Inscription réussie', userId: userId});
});

async function udpateDb(table, filter, filterValue, field, fieldValue) {
  table.updateOne(
    { [filter]: filterValue }, // Filtre pour trouver l'utilisateur spécifique
    { $set: { [field]: fieldValue } } // Mise à jour du champ "status"
  )
  .then(result => {
      console.log(`Mise à jour réussie pour l'utilisateur avec ${filterValue}`);
      return true;
  })
  .catch(error => {
      console.error("Erreur lors de la mise à jour :", error);
      return false;
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
// Connecte-toi à MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connexion à MongoDB réussie');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB :', err);
  }
}

connectToMongo();

function insertdb(collection, doc) {

  collection.insertOne(doc, (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion du document :', err);
      return;
    }
    console.log('Document inséré avec succès :', result.insertedId);
  });
}

function searchdb(collection, champ, valeur) {
    collection.find({ [champ]: valeur }).toArray((err, documents) => {
      if (err) {
        console.error('Erreur lors de la recherche des documents :', err);
        reject(err);
        return;
      }
      console.log('Résultat de la recherche :', documents);
      resolve(documents); // Renvoie les documents trouvés
  });
}

