
/*
docker run --name mongodb -d -p 27017:27017 mongodb/mongodb-community-server
docker ps -a
*/

const express = require('express');
const app = express();

const bcrypt = require('bcrypt');

const path = require('path');

const cors = require('cors');
const bodyparser = require('body-parser');

const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
app.use(cookieParser('maThIs273'));

const nodemailer = require('nodemailer');

const port = 3000;

/*
const url = 'mongodb+srv://mathisfriess:L4HEfJzdFX7tcgKI@dragonshop.9wodojn.mongodb.net/?retryWrites=true&w=majority&appName=DragonShop';
const { MongoClient } = require('mongodb');
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = client.db("dragonshop");
const usersCollection = db.collection('users');
*/
// L4HEfJzdFX7tcgKI

//docker run -d -p 27017:27017 --name my_mongo mongo

const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb://localhost:27017';

const client = new MongoClient(uri);

mongo();

async function mongo() {
  try {
    await client.connect();
    console.log("Connexion a la bdd réussie");
  } catch(error) {
    console.error('Erreur lors de la connexion à MongoDB:', error);
  }
}

const DB_NAME = 'web';
const db = client.db(DB_NAME);
const usersCollection = db.collection('users');
const conversationsCollection = db.collection('conversations');

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

app.post('/conversation/get', async(req, res) => {
  const data = req.body;

  const userId = data.userId;
  const nbMessages = data.nbMessages;

  var sortedMail1;
  var sortedMail2;

  // On trie nos mails par ordre alphabétique pour rechercher plus facilement dans la bdd si une ocnversation existe
  if(data.mail1 < data.mail2) {
    sortedMail1 = data.mail1;
    sortedMail2 = data.mail2;
  } else {
    sortedMail2 = data.mail1;
    sortedMail1 = data.mail2;
  }

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined) {

    // Un seul utilisateur avec l'userId
    if(request.length == 1) {

      // On vérifie qu'au moins un des deux mail a qui le message est destiné correspondent a l'userId
      if(await request[0].mail == sortedMail1 || await request[0].mail == sortedMail2) {

        // On cherche une conversation correspondant aux deux mails
        request = await conversationsCollection.find({"mail1":sortedMail1, "mail2":sortedMail2}).toArray();

        // On vérifie qu'une seule conversation corresponde sinon erreur 
        if(request.length == 1) {
          const tabLength = request[0].messages.length;
          var newData = [];

          if(nbMessages <= tabLength) {
            for(let i = 0; i < nbMessages; i++) {
              newData.push(request[0].messages[tabLength-nbMessages+i]);
            }
          } else {
            newData = request[0].messages;
          }
          res.status(200).send(newData);
        } else {
        console.log("La conversation n'existe pas");
        res.status(400).send("La conversation n'existe pas");
        }
      } else {
        console.log("Le mail ne correspond pas a l'userId");
        res.status(400).send("Le mail ne correspond pas a l'userId");
      }
    } else {
      console.log("erreur userId");
      res.status(400).send("Erreur userId");
    }
  } else {
    console.log("UserId invalide");
    res.status(400).send("UserId invalide");
  }
});

app.get("/users/search/:filter/:field", async (req, res) => {
  const filter = req.params.filter;
  const field = req.params.field;

  const request = {
    find:"users",
    filter:{[filter]:field}
  };
  const rep = await asyncSearch(request);

  const documents = rep.cursor.firstBatch;
  const resTab = [];

  documents.forEach((doc, index) => {
    resTab.push(doc);
  });

  if(resTab[0] != undefined) {
    res.send(resTab);
  } else {
    res.status(204).end();
  }
});

app.post('/signup', async (req, res) => {

  const request = {
    find:"users",
    filter:{mail:req.body.mail}
  };

  var rep = await asyncSearch(request);
  rep = rep.cursor.firstBatch[0];

  if(rep != undefined) {
    res.status(400).end();
    return;
  }

  const hashedPassword = await hashPassword(req.body.password);
  const userId = await newUserId();

  const newuser = {
    "name" : req.body.name,
    "lastname" : req.body.lastname,
    "mail": req.body.mail,
    "password": hashedPassword,
    "userId": userId,
    "avatar": req.body.avatar,
    "role": "client" // client, admin
  }

  insertdb(usersCollection, newuser);

  res.status(200).json({ message: 'Inscription réussie', userId: userId});
});

async function checkPermissions(userId) {
  const request = {
    find:"users",
    filter:{userId:userId}
  };

  var rep = await asyncSearch(request);
  rep = rep.cursor.firstBatch[0]

  if(rep != undefined) {
    const role = rep.role;
    return (role == "admin");
  } else {
    return false;
  }
}

app.get("/admin-add/:name", (req, res) => {
  const name = req.params.name;
  udpateDb(usersCollection, "name", name, "role", "admin");
  console.log(name+" est maintenant admin");
  res.status(200).send(name+" est maintenant admin");
});

app.get("/changeUserInfo/:userId/:name/:lastname/:mail", async (req, res) => {
  const userId = req.params.userId;
  const name = req.params.name;
  const lastname = req.params.lastname;
  const mail = req.params.mail;

  if(await checkPermissions(userId)) {
    udpateDb(usersCollection, "mail", mail, "name", name);
    udpateDb(usersCollection, "mail", mail, "lastname", lastname);
    res.status(200).send("ok");
  } else {
    console.log("pas les perms");
    res.status(400).end("erreur");
  }
});

app.get("/admin/:userId", async (req, res) => {
  console.log("admin: "+req.params.userId);
  if(await checkPermissions(req.params.userId)) {
    const html = `
    <strong>Chercher un utilisateur</strong><br>
    <label for="searchFilter">Filtre :</label>
    <select id="searchFilter">
        <option value="name">name</option>
        <option value="lastname">lastname</option>
        <option value="mail">mail</option>
    </select> <br>
    <input type="text" id="searchField" required>
    <button onclick="searchUserAdmin()">Chercher</button> <br>
    <br>
    <strong><div id="resText"></div></strong>
    <div id="searchResults"></div>`;
    res.status(200).json({html:html});
  } else {
    const html = `
    <strong>Vous n'avez pas les autorisation necessaires</strong>`;
    res.status(201).json({html:html});
  }
});

app.post('/conversation/new-message', async(req, res) => {
  const data = req.body;
  // On garde en variable l'envoyeur du message
  const sender = data.mail1;

  var sortedMail1;
  var sortedMail2;

  // On trie nos mails par ordre alphabétique pour rechercher plus facilement dans la bdd si une ocnversation existe
  if(data.mail1 < data.mail2) {
    sortedMail1 = data.mail1;
    sortedMail2 = data.mail2;
  } else {
    sortedMail2 = data.mail1;
    sortedMail1 = data.mail2;
  }

  const userId = data.userId;
  const message = data.message;

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined) {

    // Un seul utilisateur avec l'userId
    if(request.length == 1) {

      // On vérifie qu'au moins des deux mail a qui le message est destiné correspondent a l'userId
      if(await request[0].mail == sortedMail1 || await request[0].mail == sortedMail2) {

        // On cherche une conversation correspondant aux deux mails
        request = await conversationsCollection.find({"mail1":sortedMail1, "mail2":sortedMail2}).toArray();

        // On vérifie qu'une seule conversation corresponde sinon erreur 
        if(request.length == 1) {
          console.log("tentative ajout message bdd");

          // On récupère l'id et on push le nouveau message
          const id = request[0]._id;
          const result = await conversationsCollection.updateOne(
            { _id: id }, // Filtre pour sélectionner la conversation spécifique
            { 
                $push: { 
                    messages: {"sender":sender, "content":message} 
                } 
            }
        );

        if (result.modifiedCount === 1) {
            console.log("Conversation mise à jour avec succès");
            res.status(200).send("La conversation a été mise a jour");
        } else {
            console.log("La conversation n'a pas été trouvée ou n'a pas été mise à jour");
            res.status(400).send("La conversation n'a pas été trouvé");
        }
        } else {
          console.log("Plusieurs conversation avec les memes mail");
          console.log("request length : "+request.length);
          res.status(400).send("Plusieurs conversations avec les memes mail");
        }
      } else {
        console.log("Les mails ne correspondent pas");
        res.status(400).send("Les mails ne correspondent pas");
      }
    } else {
      console.log("UserId incorrect");
      res.status(400).send("UserId incorrect");
    }
  }
})

// Route permettant de créer une nouvelle conversation a base 
app.post('/conversation/new', async (req, res) => {
  const data = req.body;
  var mail1;
  var mail2;

  if(req.body.mail1 < req.body.mail2) {
    mail1 = req.body.mail1;
    mail2 = req.body.mail2;
  } else {
    mail2 = req.body.mail1;
    mail1 = req.body.mail2;
  }

  if(mail1 == mail2) {
    res.status(400).send("Mails identiques");
    console.log("Mails identiques");
    return;
  }

  const convlist = await conversationsCollection.find({"mail1":mail1, "mail2":mail2}).toArray();
  alreadyExist = convlist.length != 0;

    if (alreadyExist) {
      return res.status(400).send("La conversation existe deja");
    } else {
      var newData = {
        "mail1": mail1,
        "mail2": mail2,
        "messages":[]
      }

      await insertdb(conversationsCollection, newData);
      res.status(200).send("Conversation crée");
    }
  })

app.post('/login', async (req, res) => {

  const passwordAttempt = await req.body.password;
  const mail = await req.body.mail;
  
  const request = {
    find:"users",
    filter:{mail:mail}
  };

  var rep = await asyncSearch(request);
  rep = rep.cursor.firstBatch[0];
  if(rep == undefined) {
    console.log("Aucun mail ne correspond");
    res.status(205).end();
    return;
  }
  const passwordBdd = rep.password;

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

/*
  updateDb(table, filtre, valeurViltre, champs, valeur champs) :
  
  Permet de mettre a jour un element dans une table.
  On renseigne la table dans table, puis un filtre et sa valeur pour trouver l'element en question. Enfin
    le champs a update et sa nouvelle valeur

  Renvoie true si la mise a jour a réussi et false si elle a échouée
*/
async function udpateDb(table, filter, filterValue, field, fieldValue) {
  table.updateOne(
    { [filter]: filterValue }, // Filtre pour trouver l'utilisateur spécifique
    { $set: { [field]: fieldValue } }
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
/*
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connexion à MongoDB réussie');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB :', err);
  }
}
*/

function insertdb(collection, doc) {

  console.log("tentative d'insertion");
  collection.insertOne(doc, (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion du document :', err);
      return;
    }
    console.log('Document inséré avec succès :', result.insertedId);
  });
}

function searchdb(collection, champ, valeur) {
  console.log("Tentative searchdb");
    collection.find({ [champ]: [valeur] }).toArray((err, documents) => {
      if (err) {
        console.error('Erreur lors de la recherche des documents :', err);
        reject(err);
        return;
      }
      console.log('Résultat de la recherche :', documents);
      resolve(documents); // Renvoie les documents trouvés
  });
}

