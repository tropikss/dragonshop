
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
const { send } = require('process');
const { ObjectId } = require('mongodb');

const port = 5000;

// Middleware pour servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Route pour votre API backend
app.get('/api', (req, res) => {
  res.send('Hello from the backend!');
});

// Route pour servir les fichiers frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

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
const websocket = require('./websocket');

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
const friendrequestCollection = db.collection("friend-request");
const friendCollection = db.collection("friend");
const notificationsCollection = db.collection('notifications');

app.use(cors( { origin: [`http://localhost:5000`, `http://digidooglechat.cluster-ig3.igpolytech.fr/index.html`], credentials: true } ));
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

// ------------------------------ demande ami / ami -----------------------------

// Permet d'ajouter une nouvelle friend-request, mettant son status en pending, contient toute le verification necessaire
app.post("/friend-request/add", async(req, res) => {  
  const data = req.body;

  const sender = data.sender;
  const receiver = data.receiver;
  const userId = data.userId; // sender userId
  // On doit vérifier que notre userId correspond a celui du sender

  if(sender == receiver) {
    res.status(400).send("Impossible de se comprendre");
    return;
  }

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined && request.length != 0) {

    // Un seul utilisateur avec l'userId
    if(request.length == 1) {
      request = request[0];

      if(request.mail == sender) {

        var request1 = await friendrequestCollection.find({"sender":sender, "receiver":receiver}).toArray();
        var request2 = await friendrequestCollection.find({"sender":receiver, "receiver":sender}).toArray();

        if(request1 != undefined && request1.length == 0 && request2 != undefined && request2.length == 0) {
          // Si on est la c'est qu'on a le droit d'ajouter une nouvelle friend-request
          const data = {
            "sender":sender,
            "receiver":receiver,
            "status":"pending"
          }

          insertdb(friendrequestCollection, data);

          res.status(200).send("Friend request ajouté");
        } else {
          res.status(400).send("La friend request existe deja");
        }
      } else {
        res.status(400).send("Mail sender et userId ne correspondent pas");
      }
    } else {
      res.status(400).send("Deux utilisateurs avec le meme userId");
    }
  } else {
    res.status(400).send("userId incorrect");
  }

});

// Permet d'accepter une demande d'ami
app.post("/friend-request/accept", async(req,res) => {
  // body : userID et mail sender
  const data = req.body;
  const sender = data.sender;
  var receiver;
  const userId = data.userId; // userId du receiver
  // On doit vérifier que l'userId donné correspond a la personne qui a le droit d'accepter la requete
  //    c'est a dire qu'on doit chercher une requete contenant un sender et un receiver correspondant

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      receiver = request.mail;
      console.log(receiver);
      console.log(sender);

      request = await friendrequestCollection.find({"sender":sender, "receiver":receiver}).toArray();

      if(request != undefined && request.length != 0) {
        if(request.length == 1) {
          request = request[0];
          if(request.status == "pending") {
            // Si on est ici, alors l'userId correpond bien a qlq et il existe bien une friend-request correspondante
            friendrequestCollection.updateOne({"sender": sender, "receiver": receiver}, {$set: {"status": "accepted"}});          
            
            // On vérifie que l'on a pas deja un friend qui correspond
            var request1 = friendCollection.find({"mail1":sender, "mail2":receiver}).toArray();
            var request2 = friendCollection.find({"mail1":receiver, "mail2":sender}).toArray();

            if((await request1).length == 0 && (await request2).length == 0) {
              // On ajoute notre nouvelle relation amicale 
              const data = {
                "mail1": sender,
                "mail2": receiver,
                "date": new Date()
              }

              insertdb(friendCollection, data);
              friendrequestCollection.deleteOne({"sender":sender, "receiver":receiver});
              res.status(200).send("Les deux clients sont maintenant amis");
            } else {
              res.status(400).send("Les deux clients sont deja amis");
            }
          } else {
            res.status(300).send("La demande n'est pas en attente d'acceptation");
          }
        } else {
          res.status(400).send("Plusieurs demande d'ami correspondante");
        }
      } else {
        res.status(400).send("Aucune demande d'ami correspondante");
      }

    } else {
      res.status(400).send("Plusieurs users avec le meme userId");
    }
  } else {
    res.status(400).send("L'userId n'est pas correct");
  }
});

app.post("/friend-request/deny", async(req,res) => {
  // body : userID et mail sender
  const data = req.body;
  const sender = data.sender;
  var receiver;
  const userId = data.userId; // userId du receiver
  // On doit vérifier que l'userId donné correspond a la personne qui a le droit d'accepter la requete
  //    c'est a dire qu'on doit chercher une requete contenant un sender et un receiver correspondant

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      receiver = request.mail;
      console.log(receiver);
      console.log(sender);

      request = await friendrequestCollection.find({"sender":sender, "receiver":receiver}).toArray();

      if(request != undefined && request.length != 0) {
        if(request.length == 1) {
          request = request[0];
          if(request.status == "pending") {
            // Si on est ici, alors l'userId correpond bien a qlq et il existe bien une friend-request correspondante
            friendrequestCollection.updateOne({"sender": sender, "receiver": receiver}, {$set: {"status": "rejected"}});          
            friendrequestCollection.deleteOne({"sender":sender, "receiver":receiver});

            res.status(200).send("Rejet confirmé");
          } else {
            res.status(300).send("La demande n'est pas en attente d'acceptation");
          }
        } else {
          res.status(400).send("Plusieurs demande d'ami correspondante");
        }
      } else {
        res.status(400).send("Aucune demande d'ami correspondante");
      }

    } else {
      res.status(400).send("Plusieurs users avec le meme userId");
    }
  } else {
    res.status(400).send("L'userId n'est pas correct");
  }
});

// Permet de connaitre la relation entre deux clients
app.post("/friend/get-status", async(req, res) => {
  const data = req.body;
  const userId = data.userId;
  const otherMail = data.otherMail;
  var selfMail;

  var request = usersCollection.find({"userId":userId}).toArray();

  if((await request) && (await request).length != 0) {
    if((await request).length == 1) {
      console.log((await request)[0]);
      selfMail = (await request)[0].mail;
    } else {
      res.status(400).send("Plusieurs userId identiques");
      return;
    }
  } else {
    res.status(400).send("UserId incorrect");
    return;
  }

  if(otherMail == selfMail) {
    res.status(200).json({"status":"self"});
    return;
  }

  // On commence par chercher dans friend
  request = friendrequestCollection.find({$or:[{"sender":selfMail, "receiver":otherMail},{"sender":otherMail, "receiver":selfMail}]}).toArray();

  if((await request) && (await request).length != 0) {
    if((await request)[0].status == "pending") {
      res.status(200).json({"status":"pending"});
    } else {
      res.status(400).send("Friend request existante mais pas en pending");
    }

  } else {
    // Si il n'y a rien dans friend request on cherche dans friend
    request = friendCollection.find({$or:[{"mail1":selfMail, "mail2":otherMail},{"mail1":otherMail, "mail2":selfMail}]}).toArray();
    
    if((await request) && (await request).length != 0) {
      res.status(200).send({"status":"accepted"});
    } else {
      res.status(200).send({"status":"none"});
    }
  }
}); 

app.post("/friend-request/get", async(req, res) => {
  const data = req.body;
  const userId = data.userId;

  var request = await usersCollection.find({"userId":userId}).toArray();
  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      const mail = request.mail;
      console.log("Demande liste demande amis de "+mail);

      request = await friendrequestCollection.find({ "receiver": mail }).toArray();
      res.status(200).json(request);
    } else {
      res.status(400).send("Plusieurs UserId correspondant");
    }
  } else {
    res.status(400).send("UserId incorrect");
  }
});

app.post("/friend-request/deny", async(req,res) => {
  // body : userID et mail sender
  const data = req.body;
  const sender = data.sender;
  var receiver;
  const userId = data.userId; // userId du receiver
  // On doit vérifier que l'userId donné correspond a la personne qui a le droit de refuser la requete
  //    c'est a dire qu'on doit chercher une requete contenant un sender et un receiver correspondant

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      receiver = request.mail;

      request = await friendrequestCollection.find({"sender":sender, "receiver":receiver}).toArray();

      if(request != undefined && request.length != 0) {
        if(request.length == 1) {
          console.log(request);
          request = request[0];
          if(request.status == "pending") {
            // Si on est ici, alors l'userId correpond bien a qlq et il existe bien une friend-request correspondante
            friendrequestCollection.updateOne({"sender": sender, "receiver": receiver}, {$set: {"status": "rejected"}});          
            res.status(200).send("Demande d'ami refusé");
          } else {
            res.status(300).send("La demande n'est pas en attente");
          }
        } else {
          res.status(400).send("Plusieurs demande d'ami correspondante");
        }
      } else {
        res.status(400).send("Aucune demande d'ami correspondante");
      }

    } else {
      res.status(400).send("Plusieurs users avec le meme userId");
    }
  } else {
    res.status(400).send("L'userId n'est pas correct");
  }
});

app.post("/friend/get", async(req,res) => {
  const data = req.body;
  const userId = data.userId;

  var request = await usersCollection.find({"userId":userId}).toArray();
  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      const mail = request.mail;
      console.log("Demande liste amis de "+mail);

      request = await friendCollection.find({$or:[{ "mail1": mail },{ "mail2": mail }]}).toArray();
      res.status(200).json(request);
    } else {
      res.status(400).send("Plusieurs UserId correspondant");
    }
  } else {
    res.status(400).send("UserId incorrect");
  }
});

app.post("/friend/add", async(req,res) => {
  const data = req.body;
  const mail1 = data.mail1;
  const mail2 = data.mail2;
  const userId = data.userId;

  if(mail1 == mail2) {
    res.status(400).send("Impossible de se comprendre");
    return;
  }

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      const receiver = request.mail;
      
      var request1 = friendrequestCollection.find({"sender":mail1, "receiver":mail2}).toArray();
      var request2 = friendrequestCollection.find({"sender":mail2, "receiver":mail1}).toArray();


      // On cherche la demande d'ami qui correspond et on la met dans request
      if((await request1).length == 0 && (await request2).length == 1) {
        request = (await request2)[0];
      } else if((await request1).length == 1 && (await request2).length == 0) {
        request = (await request1)[0];
      } else {
        res.status(400).send("Demande d'ami inexistante");
      }

      // Maintenant on a la la bonne demande ami dans request
      if(request.receiver == receiver){
          if(request.status == "accepted") {
            // On vérifie que l'on a pas deja un friend qui correspond
            request1 = friendCollection.find({"mail1":mail1, "mail2":mail2}).toArray();
            request2 = friendCollection.find({"mail1":mail2, "mail2":mail1}).toArray();

            if((await request1).length == 0 && (await request2).length == 0) {
              // On ajoute notre nouvelle relation amicale 
              const data = {
                "mail1": mail1,
                "mail2": mail2,
                "date": new Date()
              }

              insertdb(friendCollection, data);
              res.status(200).send("Les deux clients sont maintenant amis");
            } else {
              res.status(400).send("Les deux clients sont deja amis");
            }
          } else {
            res.status(400).send("La demande d'ami n'est pas acceptée"); 
          }
      } else {
        res.status(400).send("L'userId n'est pas le receiver de la demande d'ami");
      }
    } else {
      res.status(400).send("Plusieurs userId identiques");
    }
  } else {
    res.status(400).send("UserId incorrect");
  }
  // Normalement, vu que l'on ne peut pas

})

app.post("/friend/delete", async(req,res) => {
  const data = req.body;
  const otherMail = data.otherMail;
  const userId = data.userId;

  var request = await usersCollection.find({"userId":userId}).toArray();

  if(request != undefined && request.length != 0) {
    if(request.length == 1) {
      request = request[0];
      const selfMail = request.mail;
    
      var request1 = friendCollection.find({"mail1":selfMail, "mail2":otherMail}).toArray();
      var request2 = friendCollection.find({"mail1":otherMail, "mail2":selfMail}).toArray();

      if((await request1).length == 1 && (await request2).length == 0) {
        request = (await request1)[0];
      } else if((await request1).length == 0 && (await request2).length == 1){
        request = (await request2)[0];
      } else {
        res.status(400).send("Ces deux personnes ne sont pas amis");
        return;
      }

      friendCollection.deleteOne({"mail1":request.mail1, "mail2":request.mail2});
      res.status(200).send("Les deux clients ne sont plus amis");

    } else {
      res.status(400).send("Plusieurs userId identiques");
    }
  } else {
    res.status(400).send("UserId incorrect");
  }
  // Normalement, vu que l'on ne peut pas

})

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

// --------------------------------- NOTIFICATION ---------------------------------------

app.post('/notification/add', async(req, res) => {
  const data = req.body;

  const sender = data.sender;
  const target = data.target;
  const content = data.content;
  const userId = data.userId;

  const query = {"userId": userId};

  const projection = {
    mail: 1
  };

  var request = await usersCollection.find(query).project(projection).toArray();

  if(request && request.length == 1) {
    request = request[0];

    if(request.mail == sender) {
      notificationsCollection.insertOne({"target":target, "sender":sender, "content":content});
      res.status(200).send("Notification crée");
    } else {
      res.status(400).send("L'userId et le mail du sender ne correspondent pas");
    }

  } else {
    res.status(400).send("UserId incorrect");
  }

});

app.post('/notification/get', async(req, res) => {
  const data = req.body;

  const userId = data.userId;

  const query = {"userId": userId};

  var projection = {
    mail: 1
  };

  var request = await usersCollection.find(query).project(projection).toArray();

  if(request && request.length == 1) {
    request = request[0];
    const target = request.mail;
    console.log(target);

    projection = {
      target: 1,
      sender: 1,
      content: 1,
    };

    var request = await notificationsCollection.find({"target":target}).project(projection).toArray();
    res.status(200).json(request);

  } else {
    res.status(400).send("L'userId ne correspond pas");
  }
});

app.post('/notification/delete', async(req, res) => {
  const data = req.body;

  const userId = data.userId;
  const id = new ObjectId(data.id);

  const query = {"userId": userId};

  var projection = {
    mail: 1
  };

  var request = await usersCollection.find(query).project(projection).toArray();

  if(request && request.length == 1) {
    request = request[0];
    const mail = request.mail;

    request = await notificationsCollection.find({"_id":id}).toArray();

    if(request && request.length == 1) {
      if(request[0].target == mail) {
        notificationsCollection.deleteOne({"_id":id});
        res.status(200).send("Notification supprimée");
      } else {
        res.status(400).send("UserId et mail target ne correspondent pas");
      }
    } else {
      res.status(400).send("Notification introuvable");
    }
  } else {
    res.status(400).send("UserId incorrect");
  }
});

// --------------------------------------------------------------------------------------

app.get("/users/search/:filter/:field", async (req, res) => {
  const filter = req.params.filter;

  if(filter != "userId" && filter != "mail" && filter != "name" && filter != "lastname") {
    res.status(400).send("Filtre non autorisé");
    return;
  }

  const field = req.params.field;

  const query = { [filter]: field };

  const projection = {
    name: 1,
    lastname: 1,
    mail: 1,
    avatar: 1,
    role: 1
  };

  const rep = await usersCollection.find(query).project(projection).toArray();

  if(rep[0] != undefined) {
    res.send(rep);
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

