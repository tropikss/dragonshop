
//const bcryptjsjs = require('bcryptjsjsjs');
// Dragonshop38

// TYPES : 

// Définie les caracteristiques d'un utilsateur
class User {
  constructor(name, lastname, mail, password) {
      this.name = name;
      this.lastname = lastname;
      this.mail = mail;
      this.password = password;
  }
} 

// Permet de récupérer la valeur du cookie avec le nom indiqué
// getCookie(String) -> String
// getCookie("UserId") -> aA5bC-4g6...
function getCookie (nom) {
  nom = nom + "=";
  var liste = document.cookie.split (';');
  for (var i = 0; i < liste.length; i++) {
      var c = liste[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nom) == 0) return c.substring(nom.length, c.length);
  }
  return null;
}

// Permet de définir les boutons de connexion, deconnexion etc...en fonction de l'utilisateur
async function userInfo() {
  if (document.cookie.includes('userId')) { // Cherche le cookie userId (si l'utilisateur est bien connecté)

    const userId = getCookie("userId");
    console.log("userId : "+userId);

    // récupère les données de l'utilisateur en cours
    var res = await getServer("http://localhost:3000/users/search/userId/"+userId);

    if(res != undefined) { // si un utilisateur existe bien
      res = (await res.json())[0];
      
      var button = document.createElement("button");
      button.setAttribute("onclick", "logout()");
      button.textContent = "Déconnexion";
      document.getElementById("logButton").appendChild(button);

      button = document.createElement("button");
      button.setAttribute("onclick", "window.location.href='account.html'");
      button.textContent = "Mon compte";
      document.getElementById("logButton").appendChild(button);

      button = document.createElement("button");
      button.setAttribute("onclick", "window.location.href='chat.html'");
      button.textContent = "Messagerie";
      document.getElementById("logButton").appendChild(button);
      
      if(res.role =="admin") {
        const button = document.createElement("button");
        button.setAttribute("onclick", "window.location.href='admin.html'");
        button.textContent = "Page admin";
        document.getElementById("logButton").appendChild(button);
      }
    }
  } else {
    console.log('Le cookie userId n\'est pas présent.');

    const loginButton = document.createElement("button");
    loginButton.setAttribute("onclick", "window.location.href='login.html'");
    loginButton.textContent = "Connexion";
    document.getElementById("logButton").appendChild(loginButton); 

    const signupButton = document.createElement("button");
    signupButton.setAttribute("onclick", "window.location.href='signup.html'");
    signupButton.textContent = "Inscription";
    document.getElementById("logButton").appendChild(signupButton);
  }
}

async function getAdmin() {
 const userId = getCookie("userId");
 console.log(userId);
 if(userId != null ) {
  var res = await getServer("http://localhost:3000/admin/"+userId);
  console.log(await res);
  res = await res.json();
  console.log(res);
  if(res.status == 200) {
    document.getElementById("search").innerHTML = res.html;
    return;
  } else {
    document.getElementById("search").innerHTML = res.html;
    return;
  }
 } else {
  document.getElementById("search").innerHTML = "<strong>Vous n'etes pas connecté</strong>";
}
}

async function loadAccount() {
  if (document.cookie.includes('userId')) {
    console.log('Le cookie userId est présent.');
    const userId = getCookie("userId");
    console.log(userId);

    var res = await getServer("http://localhost:3000/users/search/userId/"+userId);
    console.log(res);

    if(res != undefined) {
      res = (await res.json())[0];
      console.log(res);

      const resText = document.createElement("strong");
      resText.textContent = "Vos informations : ";

      const resName = document.createElement("div");
      resName.textContent = "Prenom : "+res.name;

      const resLastname = document.createElement("div");
      resLastname.textContent = "Nom : "+res.lastname;

      const resMail = document.createElement("div");
      resMail.textContent = "Mail : "+res.mail;

      document.getElementById("userInfo").appendChild(resText);
      document.getElementById("userInfo").appendChild(resName);
      document.getElementById("userInfo").appendChild(resLastname);
      document.getElementById("userInfo").appendChild(resMail);

    } else {
      const text = document.createElement("strong");
      text.textContent = "Vous n'etes pas connecté";

      document.getElementById("userInfo").appendChild(text);
    }
  }
}

function logout() {
  document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  location.reload();
}

async function loginSubmit() {
  const mail = document.getElementById("mailField").value.toLowerCase();
  const password = document.getElementById("passwordField").value;
  console.log(mail);
  const hashedPassword = await hashPassword(password);

  const loginData = {mail:mail, password:hashedPassword};

  const requestOptions = {
    method: 'POST', // Méthode de la requête
    headers: {
      'Content-Type': 'application/json' // Type de contenu du corps de la requête (JSON)
    },
    body:JSON.stringify(loginData) // Corps de la requête, converti en JSON
  };
    
  fetch('http://localhost:3000/login', requestOptions)
      .then(response => {
        if(response.status == 205) {
          console.log("Email introuvable");
          document.getElementById("resText").style.color = "red";
          document.getElementById("resText").style.fontWeight = "bold";
          document.getElementById("resText").textContent = "Email incorrect";
        } else if(response.status == 204) {
          document.getElementById("resText").style.color = "red";
          document.getElementById("resText").style.fontWeight = "bold";
          document.getElementById("resText").textContent = "Mot de passe incorrect";
        } else if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log(data.message);

        document.getElementById("resText").style.color = "green";
        document.getElementById("resText").style.fontWeight = "bold";
        document.getElementById("resText").textContent = "Connexion réussie";
        window.location.href = "index.html";
        createCookie("userId", data.userId, 30);
      }) 
      .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
      });
}

async function hashPassword(password) {
  // Convertir le mot de passe en tableau de bytes
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Calculer le hachage SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);

  // Convertir le hachage en chaîne hexadécimale
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

async function userInfoChange(i) {

  const userId = await getCookie("userId");
  console.log(userId);

  const names = document.querySelectorAll('[data-type="name"]');
  const lastnames = document.querySelectorAll('[data-type="lastname"]');
  const mails = document.querySelectorAll('[data-type="mail"]');

  var name;
  var lastname;
  var mail;
  
  names.forEach(el => {
    if(el.getAttribute("i") == i.toString()) {
      name = el.value;
    }
  })
  lastnames.forEach(el => {
    if(el.getAttribute("i") == i.toString()) {
      lastname = el.value;
    }
  })
  mails.forEach(el => {
    if(el.getAttribute("i") == i.toString()) {
      mail = el.textContent;
    }
  })
  console.log(name);
  console.log(lastname);
  console.log(mail);

  const res = await getServer("http://localhost:3000/changeUserInfo/"+userId+"/"+name+"/"+lastname+"/"+mail);
  if(await res.status == 200) {
    console.log("modification effectué avec succès");
    alert("Modification réussie");
  } else {
    console.log("erreur lors de la modification");
  }
}

async function searchUserAdmin() {
  const field = document.getElementById("searchField").value;
  const filter = document.getElementById("searchFilter").value;

  console.log(field);
  console.log(filter);

  console.log("http://localhost:3000/users/"+filter+"/"+field);
  var res = await getServer("http://localhost:3000/users/search/"+filter+"/"+field);

  if(res != undefined) {
    res = await res.json();
    console.log(res);

    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "";

    var i = 0;

    res.forEach(el => {
      i++;
      const box = document.createElement("div");
      box.style.border = "1px solid black";

        const labelName = document.createElement("div");
        labelName.textContent = "Prenom : ";

        const labelLastname = document.createElement("div");
        labelLastname.textContent = "Nom : ";

        const labelMail = document.createElement("div");
        labelMail.textContent = "Mail : ";

          const name = document.createElement("input");
          name.setAttribute("i", i.toString());
          name.setAttribute("data-type", "name");
          name.value = el.name;

        labelName.appendChild(name);

          const lastname = document.createElement("input");
          lastname.setAttribute("i", i.toString());
          lastname.setAttribute("data-type", "lastname");
          lastname.value = el.lastname;

        labelLastname.appendChild(lastname);

          const mail = document.createElement("span");
          mail.setAttribute("i", i.toString());
          mail.setAttribute("data-type", "mail");
          mail.textContent = el.mail;

        labelMail.appendChild(mail);

        const buttonLabel = document.createElement("span");
        buttonLabel.setAttribute("id","buttonLabel");

        const button = document.createElement("button");
        button.textContent = "Modifier";
        button.onclick = function() {
          userInfoChange(i);
        };
      box.appendChild(labelMail);
      box.appendChild(labelName);
      box.appendChild(labelLastname);
      box.appendChild(button);
      box.appendChild(buttonLabel);

      searchResults.appendChild(box);
      searchResults.appendChild(document.createElement("br"));
    });

    document.getElementById("resText").textContent = "Resultat de la recherche :";

  } else {
    document.getElementById("resText").textContent = "Aucun élément trouvé pour "+filter+":"+field;
    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "";
  }
}

async function getCurrentMail() {
  const userId = await getCookie("userId");

  if(await userId != undefined) {
    var res = await getServer("http://localhost:3000/users/search/userId/"+userId);
    if(await res != undefined) {
      res = await res.json();
      res = res[0];
      console.log(res);
      return res.mail;
    } else {
      console.log("probleme avec l'userId");
    }
  } else {
    return undefined;
  }
}

var socket;
var mail1;

async function connectToWebsocket() {

  const mailUser = await getCurrentMail();
  console.log(mailUser);

  socket = new WebSocket('ws://localhost:8080/'+mailUser);

  socket.addEventListener('open', function (event) {
    console.log('Connecté au serveur WebSocket');
  });

  socket.addEventListener('message', function (event) {
      var data = event.data;
      console.log("data : "+data);
      data = JSON.parse(data);
      switch (data.type) {
        case "message":
          console.log(data.content);
          addMessage(data.mail, data.message)
          break;
        case "chat-accept":
          console.log("chat-accept");
          newChat(mailUser, data.mail);
          break;
      }
  });
  // fonction qui créer une fenetre de dialogue sur le front
  // ajoute le mail a la liste des conversations

  // Gestionnaire d'événement pour les erreurs
  socket.addEventListener('error', function (event) {
      console.error('WebSocket error:', event);
  });

  // Gestionnaire d'événement pour la fermeture de la connexion
  socket.addEventListener('close', function (event) {
      console.log('Déconnecté du serveur WebSocket');
  });
}

async function addMessage(mail, message) {
  var chat = document.getElementById(mail+"-chatContent");

  const msg = document.createElement("div");
  msg.style.width = "1el";
  msg.style.height = "25px";

  const currentMail = await getCurrentMail();
  console.log(await currentMail);
  console.log(mail);

  if(selfMail == await currentMail) {
    msg.style.textAlign = "right";
  } else {
    msg.style.textAlign = "left";
  }
  msg.textContent = message;
  msg.style.border = "1px solid black";

  chat.appendChild(msg);
}

function newChat(selfMail, otherMail) {
  const chat = document.getElementById("chat");

  const box = document.createElement("div");
  const mailbox = document.createElement("span");

  mailbox.style.fontWeight = "bold";
  mailbox.textContent = otherMail;
  box.appendChild(mailbox);

  box.setAttribute("id", "div-"+otherMail);
  box.style.border = "2px solid black";
  box.style.width = "50%";
  box.style.height = "200px";

  const chatField = document.createElement("input");
  chatField.setAttribute("id", "chatField");
  chatField.type = "text";

  const chatContent = document.createElement("div");
  box.appendChild(chatContent);
  chatContent.setAttribute("id", otherMail+"-chatContent");

  const button = document.createElement("button");
  button.textContent = "Envoyer";
  button.onclick = function() {
    const message = document.getElementById("chatField").value;

    var data = {
      "type":"message",
      "senderMail":selfMail,
      "receiverMail":otherMail,
      "message":message
    }
    data = JSON.stringify(data);
    socket.send(data);

    addMessage(selfMail, message);
  }
  box.appendChild(chatField);
  box.appendChild(button);

  chat.appendChild(box);
}

function askChat(mail1, mail2) {
  const data = {
    "type":"ask-chat",
    "askerMail" : mail1,
    "askedMail" : mail2
  }

  console.log(data);
  const jsonData = JSON.stringify(data);
  console.log(jsonData);
  socket.send(jsonData);
}

async function displayUser() {

  const mail1 = await getCurrentMail();
  console.log("current mail : "+mail1);
  const mail2 = document.getElementById("searchText").value+"@etu.umontpellier.fr";

  res = await getServer("http://localhost:3000/users/search/mail/"+mail2);

  if(res != undefined) {
    res = await res.json();
    res = res[0];

    document.getElementById("searchRes").textContent = "Resultat :";
    document.getElementById("searchRes").style.color = "black";
    document.getElementById("searchRes").style.fontWeight = "bold";

    const box = document.createElement("div");
    box.style.border = "1px solid black";

    const mail = document.createElement("div");
    const name = document.createElement("div");
    const lastname = document.createElement("div");

    mail.textContent = "Mail : "+res.mail;
    name.textContent = "Prenom : "+res.name;
    lastname.textContent = "Nom de famille : "+res.lastname;

    const button = document.createElement("button");
    button.textContent = "Contacter";
    button.addEventListener("click", async function() {
      askChat(mail1, mail2);
    });

    box.appendChild(mail);
    box.appendChild(name);
    box.appendChild(lastname);
    box.appendChild(button);

    document.getElementById("foundUser").appendChild(box);
  
  } else {
    document.getElementById("searchRes").style.color = "red";
    document.getElementById("searchRes").style.fontWeight = "bold";
    document.getElementById("searchRes").textContent = "Aucun resultat";
  }
}


async function getServer(url) {
  try {
    const response = await fetch(url);
    if(response.status == 204) {
      console.log("La requete n'a rien trouvé");
      return undefined;

    } else if (!response.ok) {
      throw new Error('Le serveur a renvoyé une réponse non valide');
    }
    return response; // Retourner la réponse
  } catch (error) {
    console.error('Il y a eu un problème avec votre requête fetch:', error);
    throw error;
  }
}

function createCookie(name, field, time) { // time in minute
  var e = null;
  var date = new Date ();
  date.setTime (date.getTime() + (time * 60 * 1000));
  e = "; expires=" + date.toGMTString();
  document.cookie = name + "=" + field + e + "; path=/";
}

async function signupSubmit() {
    const name = document.getElementById("name").value.toLowerCase();
    const lastname = document.getElementById("lastname").value.toLowerCase();
    const mail = document.getElementById("mail").value.toLowerCase();
    const password = document.getElementById("password").value;
    const passwordConfirmation = document.getElementById("passwordConfirmation").value;

    let emailPattern = /^[a-zA-Z0-9._%+-]+@etu.umontpellier\.fr$/;

  if (emailPattern.test(mail)) {
    console.log("L'adresse e-mail est valide.");
  } else {
    console.log("L'adresse e-mail n'est pas valide.");
    document.getElementById("resText").style.color = "red";
    document.getElementById("resText").style.fontWeight = "bold";
    document.getElementById("resText").textContent = "Mail incorrect, utilisez un mail univ Montpellier";
    return;
  }

    if(password != passwordConfirmation) {
      document.getElementById("resText").style.color = "red";
      document.getElementById("resText").style.fontWeight = "bold";
      document.getElementById("resText").textContent = "Les mots de passe ne correspondent pas";
      return;
    }

const hashedPassword = await hashPassword(password);
const user = new User(name, lastname, mail, hashedPassword);
  
const requestOptions = {
  method: 'POST', // Méthode de la requête
  headers: {
    'Content-Type': 'application/json' // Type de contenu du corps de la requête (JSON)
  },
  body: JSON.stringify(user) // Corps de la requête, converti en JSON
};
  
fetch('http://localhost:3000/signup', requestOptions)
    .then(response => {
      if(response.status == 400) {
        document.getElementById("resText").style.color = "red";
        document.getElementById("resText").style.fontWeight = "bold";
        document.getElementById("resText").textContent = "Cet email est deja utilisé";
        console.log("Cet email est deja utilisé");
        return undefined;
  
      } else if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
      console.log(data.message);

      document.getElementById("resText").style.color = "green";
      document.getElementById("resText").style.fontWeight = "bold";
      document.getElementById("resText").textContent = "Inscription réussie";
      window.location.href = "index.html";
      createCookie("userId", data.userId, 30);
      
    }) 
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
}