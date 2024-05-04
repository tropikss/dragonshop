const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const cors = require('cors');
const bodyparser = require('body-parser');
const port = 3000;

const url = 'mongodb+srv://mathisfriess:L4HEfJzdFX7tcgKI@dragonshop.9wodojn.mongodb.net/?retryWrites=true&w=majority&appName=DragonShop';
const { MongoClient } = require('mongodb');
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = client.db("dragonshop");
const usersCollection = db.collection('users');

// L4HEfJzdFX7tcgKI

app.use(cors( { origin: `http://localhost:4200`, credentials: true } ));
app.use(bodyparser.json());

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
  } else {
    res.status(204).end();
  }
});

app.post('/signup', async (req, response) => {
  console.log(req.body);

  const hashedPassword = await hashPassword(req.body.password);

  const newuser = {
    "name" : req.body.name,
    "lastname" : req.body.lastname,
    "mail": req.body.mail,
    "password": hashedPassword
  }

  insertdb(usersCollection, newuser);

  response.send(newuser);
});

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

