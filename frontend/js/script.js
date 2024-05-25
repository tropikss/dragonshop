
//const bcryptjsjs = require('bcryptjsjsjs');
// Dragonshop38

// Définition de socket qui permet a tout le monde de communiquer avec le websocket 
var socket;

// --------------------------------- STRUCTURES --------------------------------

// Définie les caracteristiques d'un utilisateur
class User {
  constructor(name, lastname, mail, password, avatar) {
      this.name = name;
      this.lastname = lastname;
      this.mail = mail;
      this.password = password;
      this.avatar = avatar;
  }
} 

// Crée un conversation entre deux utilisateurs
class Conversation {
  constructor(mail1, mail2) {
    this.mail1 = mail1;
    this.mail2 = mail2;
    this.messages = [];
    this.nbMessages = 0;
  }
}

//|-|-|-|-|-|-|-|-|-|-|-|-|- PAGES |-|-|-|-|-|-|-|-|-|-|-|-|-

// ------------------ stockage messages ---------------------

// ------------------------- index --------------------------
/*
  Page "index"
  Permet de définir les boutons de connexion, deconnexion etc...en fonction de l'utilisateur
*/
async function index() {
  if (document.cookie.includes('userId')) { // Cherche le cookie userId (si l'utilisateur est bien connecté)

    const userId = getCookie("userId");
    console.log("userId : "+userId);

    // récupère les données de l'utilisateur en cours
    var res = await getServer("http://localhost:3000/users/search/userId/"+userId);

    if(res != undefined) { // si un utilisateur existe bien
      res = (await res.json())[0];
      
      // Bouton deconnexion
      var button = document.createElement("button");
      button.setAttribute("onclick", "logout()");
      button.textContent = "Déconnexion";
      document.getElementById("logButton").appendChild(button);

      // Bouton mon compte
      button = document.createElement("button");
      button.setAttribute("onclick", "window.location.href='account.html'");
      button.textContent = "Mon compte";
      document.getElementById("logButton").appendChild(button);

      // Messagerie
      button = document.createElement("button");
      button.setAttribute("onclick", "window.location.href='chat.html'");
      button.textContent = "Messagerie";
      document.getElementById("logButton").appendChild(button);
      
      // Page admin
      if(res.role =="admin") {
        const button = document.createElement("button");
        button.setAttribute("onclick", "window.location.href='admin.html'");
        button.textContent = "Page admin";
        document.getElementById("logButton").appendChild(button);
      }
    }
  } else {
    console.log('Le cookie userId n\'est pas présent.');

    // Connexion
    const loginButton = document.createElement("button");
    loginButton.setAttribute("onclick", "window.location.href='login.html'");
    loginButton.textContent = "Connexion";
    document.getElementById("logButton").appendChild(loginButton); 

    // Inscription
    const signupButton = document.createElement("button");
    signupButton.setAttribute("onclick", "window.location.href='signup.html'");
    signupButton.textContent = "Inscription";
    document.getElementById("logButton").appendChild(signupButton);
  }
}

// Permet de se deconnecter en supprimant le cookie userId et en raffraichissant la page
function logout() {
  document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  location.reload();
}

// ------------------------- admin --------------------------

/*
  Page "admin"
  Modifie l'html pour afficher la page admin
*/
async function admin() {

  // Vérification de l'userId
  const userId = getCookie("userId");
  console.log(userId);

 if(userId != null ) {

  // Verification si l'utilisateur est bien admin
  // /admin/userId permet de vérifier que l'userId indiqué est bien admin
  //    - 200 pour oui
  var res = await getServer("http://localhost:3000/admin/"+userId);
  console.log(await res);
  res = await res.json();
  console.log(res);

  // La page est dans "html" dans la réponse
  document.getElementById("search").innerHTML = res.html;
  return;

 } else {
  document.getElementById("search").innerHTML = "<strong>Vous n'etes pas connecté</strong>";
}
}

/*
  Page "admin"
  Modifie les informations de l'utilisateur indiqué en entrée
  Comprend une vérification de l'userId (administrateur)

 Prend en parametre l'id de la div correspondant a notre utilisateur et modifie ses données
*/
async function userInfoChange(i) {

  const userId = await getCookie("userId");
  console.log(userId);

  // Récupération de tout les id avec name, lastname et mail
  const names = document.querySelectorAll('[data-type="name"]');
  const lastnames = document.querySelectorAll('[data-type="lastname"]');
  const mails = document.querySelectorAll('[data-type="mail"]');

  var name;
  var lastname;
  var mail;
  
  // On cherche ceux correspondant a notre id
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

  /* 
    /changeUserInfo/userId/name/lastname/mail
    Permet de changer le nom prénom de l'utilisateur correspondant au mail, vérification avec l'userId des autorisations
  */
  const res = await getServer("http://localhost:3000/changeUserInfo/"+userId+"/"+name+"/"+lastname+"/"+mail);
  if(await res.status == 200) {
    console.log("modification effectué avec succès");
    alert("Modification réussie");
  } else {
    console.log("erreur lors de la modification");
  }
}

/*
  Page "admin"
  Executé lorsque l'on clique sur "chercher" dans la page admin
  Permet de d'afficher les utilisateurs cherchés et de modifier leurs informations
*/
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

// ------------------------- account --------------------------

// Permet de charger les informations de l'utilisateur
async function account() {

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

      const avatar = document.createElement("i");
      avatar.setAttribute("class","nes-"+res.avatar);

      document.getElementById("userInfo").appendChild(resText);
      document.getElementById("userInfo").appendChild(resName);
      document.getElementById("userInfo").appendChild(resLastname);
      document.getElementById("userInfo").appendChild(resMail);
      document.getElementById("userInfo").appendChild(avatar);

    } else {
      const text = document.createElement("strong");
      text.textContent = "Vous n'etes pas connecté";

      document.getElementById("userInfo").appendChild(text);
    }
  }
}

// ------------------------- login ----------------------------

/*  
  Executée lorsque l'on clique sur le bouton "connexion"
  Récupère les données de connexion, les encryptes, et les envoies. Ensuite suivant la réponse elle
    affiche les erreurs ou connecte l'utilisateur en le redirigant 
*/
async function loginSubmit() {

  // Récupération des données
  const mail = document.getElementById("mailField").value.toLowerCase();
  const password = document.getElementById("passwordField").value;

  // Encryptage
  const hashedPassword = await hashPassword(password);

  const loginData = {
    mail:mail, 
    password:hashedPassword
  };

  // Requete POST pour le serveur
  const requestOptions = {
    method: 'POST', // Méthode de la requête
    headers: {
      'Content-Type': 'application/json' // Type de contenu du corps de la requête (JSON)
    },
    body:JSON.stringify(loginData) // Corps de la requête, converti en JSON
  };
    
  fetch('http://localhost:3000/login', requestOptions)
      .then(response => {
        // Gestion des erreurs

        // 205 = email introuvable
        if(response.status == 205) {
          console.log("Email introuvable");
          document.getElementById("resText").style.color = "red";
          document.getElementById("resText").style.fontWeight = "bold";
          document.getElementById("resText").textContent = "Email incorrect";

        // 204 = mot de passe inccorect
        } else if(response.status == 204) {
          document.getElementById("resText").style.color = "red";
          document.getElementById("resText").style.fontWeight = "bold";
          document.getElementById("resText").textContent = "Mot de passe incorrect";

        // Gestion des autres erreurs
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

        // Redirection et ajout du cookie userId pour une durée de 30 minutes
        window.location.href = "index.html";
        createCookie("userId", data.userId, 60);
      }) 
      .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
      });
}

// Retourne le mot de passe en entré encrypté
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

// ------------------------- signup ---------------------------

function selectAvatar(name) {
  const div = document.getElementById("selected-image-id");
  const avatar = document.getElementById(name);

  // Réinitialiser les autres avatars
  const allAvatars = document.querySelectorAll(".selectable");
  allAvatars.forEach(otherAvatar => {
      otherAvatar.style.filter = "brightness(1) contrast(1)"; // Réinitialiser les filtres
  });

  // Appliquer les styles à l'avatar sélectionné
  div.value = name;
  avatar.style.filter = "brightness(1.05) contrast(1.1) drop-shadow(3px 3px 0px rgba(0, 0, 0, 0.7)) drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.5)) drop-shadow(5px 5px 0px rgba(0, 0, 0, 0.3))";

}

/*
  Permet d'envoyer le formulaire d'inscription d'un nouvel utilisateur
  Encryptage, gestions des erreurs etc... 
*/
async function signupSubmit() {
  const name = document.getElementById("name").value.toLowerCase();
  const lastname = document.getElementById("lastname").value.toLowerCase();
  const mail = document.getElementById("mail").value.toLowerCase();
  const password = document.getElementById("password").value;
  const passwordConfirmation = document.getElementById("passwordConfirmation").value;
  const avatar = document.getElementById("selected-image-id").value;

  console.log(avatar);

  let emailPattern = /^[a-zA-Z0-9._%+-]+@etu.umontpellier\.fr$/;

  if(avatar != "none") {
    console.log("avatar ok");
  } else {
    console.log("L'avatar n'est pas valide.");
    document.getElementById("resText").style.color = "red";
    document.getElementById("resText").style.fontWeight = "bold";
    document.getElementById("resText").textContent = "Choisissez un avatar";
    return;
  }

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
const user = new User(name, lastname, mail, hashedPassword, avatar);
console.log(user);

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

function showNotification(message) {
  const container = document.getElementById('notification-container');
  
  const notification = document.createElement('div');
  notification.setAttribute("class","nes-container notification");
  notification.style.display = "flex";
  notification.style.flexDirection = "column";
  notification.style.justifyItems = "center";

  const text = document.createElement("div");
  text.textContent = message;
  text.style.margin = "10px";

  const button = document.createElement("button");
  button.setAttribute("class", "nes-btn is-primary");
  button.textContent = "Go to";

  notification.appendChild(text);
  notification.appendChild(button);
  container.appendChild(notification);

  setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
      notification.remove();
      }, 500); // Correspond à la durée de l'animation de disparition
  }, 3000); // La notification disparaît après 3 secondes
}

// ------------------------- chat -----------------------------

async function friendsButton() {
  // Affichage des bulles
  const titleDiv = document.getElementById("friends");
  const title = titleDiv.querySelector(".title");
  title.textContent = "Amis";

  document.getElementById("friendContent").innerHTML = "";

  const friendsButton = document.getElementById("friendsButton");
  const requestsButton = document.getElementById("requestsButton");
  const searchButton = document.getElementById("searchButton");

  friendsButton.className = "nes-btn is-disabled button-test";
  requestsButton.className = "nes-btn button-test";
  searchButton.className = "nes-btn button-test";

  // Affichage liste d'amis
  const userId = getCookie("userId");

  const postData = {
    "userId":userId
  }

  // Options de la requête
  const requestOptions = {
    method: 'POST', // Méthode HTTP POST
    headers: {
        'Content-Type': 'application/json' // Indique que le corps de la requête est au format JSON
    },
    body: JSON.stringify(postData) // Convertit les données JSON en une chaîne JSON
};

// URL de l'endpoint de l'API
const url = 'http://localhost:3000/friend/get';

// Effectuer la requête POST avec l'API Fetch
fetch(url, requestOptions)
    .then(async response => {
        // Vérifiez si la réponse est OK (status 200)
        if (response.ok) {
            console.log("Récuperation liste amis réussie");
            return response.json();
        } else {
          const text = await response.text();
          throw new Error(text);
        }
      })
    .then(async data => {
      console.log(data);
      const selfMail = await getCurrentMail();
      displayFriend(selfMail, data);
      return;
    })
    .catch(error => {
        // Gérez les erreurs d'envoi de la requête ou de traitement de la réponse
        console.error('Erreur : ', error);
    });
}

async function displayFriend(selfMail, friendTab) {
  const foundUser = document.getElementById("friendContent");

  for(let i = 0; i < friendTab.length; i++) {
    const data = friendTab[i];
    var otherMail;

    if(data.mail1 == selfMail) {
      otherMail = data.mail2;
    } else if (data.mail2 == selfMail) {
      otherMail = data.mail1;
    } else {
      console.log("Problemes mails");
      return;
    }
    console.log(otherMail);

    var request = await getServer("http://localhost:3000/users/search/mail/"+otherMail);
    request = (await(request).json());
    var avatarName;
    if(request != undefined && request.length == 1) {
      request = request[0];
      avatarName = request.avatar;
    } else {
      console.log("Probleme mail");
      return;
    }

    const box = document.createElement("section");
    box.setAttribute("class", "nes-container is-rounded with-title");
    box.style.padding = "5px";
    box.style.marginLeft = "4px";
    box.style.marginRight = "4px";

    box.style.marginBottom = "20px";
    box.style.marginTop = "25px";

    const titleDiv = document.createElement("a");
    titleDiv.setAttribute("class","nes-badge title");
    titleDiv.style.transform = "scale(0.7)";

    const title = document.createElement("span");
    title.textContent = capitalizeFirstLetter(request.name) + " " + capitalizeFirstLetter(request.lastname);
    title.style.fontSize = "75%";
    title.style.width = "auto";
    title.style.height = "auto";
    title.style.margin = "5px;"

    var status;
    // On recupere l'état de connexion de l'utilisateur concerné
    await isConnectedToWebsocket()
    .then(async () => {
        // WebSocket est connecté, exécuter votre fonction
        status = await getStatus(otherMail);
      })
    .catch((error) => {
        console.error('Erreur de connexion WebSocket :', error);
    });

    if(status) {
      title.setAttribute("class","is-success");

    } else {
      title.setAttribute("class","is-error");
    }

    titleDiv.appendChild(title);
    box.appendChild(titleDiv);

      const contentBox = document.createElement("div");
      contentBox.style.display = "flex";
      contentBox.setAttribute("id", "contentBox-"+otherMail);

        const avatar = document.createElement("i");
        avatar.setAttribute("class", "nes-"+avatarName);
        avatar.style.transform = "scale(0.6)";
        avatar.style.width = "70px"; // Ajuster à la taille désirée
        avatar.style.height = "50px"; // Ajuster à la taille désirée
        avatar.style.top = "-20px"; // Ajuster à la taille désirée
        avatar.style.left = "-5px"; // Ajuster à la taille désirée

        const contactButton = document.createElement("button");
        contactButton.textContent = "Message";
        contactButton.className = "nes-btn is-warning contactButton";
        contactButton.setAttribute("data-selfmail", selfMail);
        contactButton.setAttribute("data-othermail", otherMail);
        contactButton.style.transform = "scale(0.55)";
        contactButton.style.top = "-5px";
        contactButton.style.left = "50px";
        // contactButton.style.height = "60px";

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Supprimer";
        deleteButton.className = "nes-btn is-error";
        deleteButton.style.transform = "scale(0.55)";
        deleteButton.style.top = "-5px";
        deleteButton.style.left = "-5px";

      contentBox.appendChild(avatar);
      contentBox.appendChild(contactButton);
      contentBox.appendChild(deleteButton);


    box.appendChild(contentBox);
    foundUser.appendChild(box);
  }
  const buttons = document.querySelectorAll('.contactButton');

  // Attachez un gestionnaire d'événements à chaque bouton
  buttons.forEach(button => {
      button.addEventListener('click', function(event) {
          // Récupérez des informations sur le bouton cliqué à partir de l'événement
          const selfMail = this.dataset.selfmail;
          const otherMail = this.dataset.othermail;
          
          // Appelez la fonction avec les informations spécifiques
          newChat(selfMail, otherMail);
      });
  });
}

function requestsButton() {
  const titleDiv = document.getElementById("friends");
  const title = titleDiv.querySelector(".title");
  title.textContent = "Demandes";

  document.getElementById("friendContent").innerHTML = "";

  const friendsButton = document.getElementById("friendsButton");
  const requestsButton = document.getElementById("requestsButton");
  const searchButton = document.getElementById("searchButton");

  friendsButton.className = "nes-btn button-test";
  requestsButton.className = "nes-btn is-disabled button-test";
  searchButton.className = "nes-btn button-test";
}

function searchButton() {
  const titleDiv = document.getElementById("friends");
  const title = titleDiv.querySelector(".title");
  title.textContent = "Recherche";

  document.getElementById("friendContent").innerHTML = "";

  const friendsButton = document.getElementById("friendsButton");
  const requestsButton = document.getElementById("requestsButton");
  const searchButton = document.getElementById("searchButton");

  friendsButton.className = "nes-btn button-test";
  requestsButton.className = "nes-btn button-test";
  searchButton.className = "nes-btn is-disabled button-test";
}

/*
  Permet d'ajouter un message a une conversation
  On renseigne le mail de la conversation puis le message qui est a ajouter
*/
async function addMessage(mail, message, self) {
  // mail : mail de la la personne qui a envoyé le message

  // On récupère dans un premier temps le container correspondant a notre mail, ensuite le div correspondant aux messages
  const chatContainer = document.getElementById("chat-"+mail);
  const chat = chatContainer.querySelector(".message-list");


  // Container du message, permet d'afficher le message correctement a droite ou a gauche
  const msgContainer = document.createElement("section");

  if(self) {
    const selfMail = await getCurrentMail();
    res = await getServer("http://localhost:3000/users/search/mail/"+selfMail);
  } else {
    res = await getServer("http://localhost:3000/users/search/mail/"+mail);
  }

  if(res != undefined) {
    res = await res.json();
    res = res[0];
  
    const avatar = document.createElement("i");

    if(self) {
      msgContainer.setAttribute("class","message -right");
    } else {
      msgContainer.setAttribute("class","message -left");
      avatar.style.transform = "scaleX(-1)";
    }

    // Avatar de la discussion
    avatar.setAttribute("class", "nes-"+res.avatar);
    
      // Permet d'afficher la petite bulle correctement
      const msgDiv = document.createElement("div");
      msgDiv.className = self ? "nes-balloon from-right" : "nes-balloon from-left";

      // Partie emoji
      if(message[0] == "/") {
        msgDiv.style.width = "120px";
        msgDiv.style.height = "120px";

        const emojiDiv = document.createElement("section");
        emojiDiv.setAttribute("class", "nes-icon is-small");
        emojiDiv.style.position = "absolute";
        emojiDiv.style.top = "0px";
        emojiDiv.style.left = "0px";
        emojiDiv.style.width = "0px";
        emojiDiv.style.height = "0px";

        const emoji = document.createElement("i");
        emoji.setAttribute("class", "nes-"+message.slice(1));
        emoji.style.position = "absolute";
        emoji.style.top = "-4px";
        emoji.style.left = "-4px";

        emojiDiv.appendChild(emoji);
        msgDiv.appendChild(emojiDiv);
      } else {
        // Message en lui même
        const msg = document.createElement("p");
        msg.textContent = message;

        msgDiv.appendChild(msg);
      }

    if(self) {
      msgContainer.appendChild(msgDiv);
      msgContainer.appendChild(avatar);
    } else {
      msgContainer.appendChild(avatar);
      msgContainer.appendChild(msgDiv);
    }

    chat.appendChild(msgContainer);
    scrollToBottom(mail);
  }
}

async function loadMessages(selfMail, otherMail) {
  const userId = getCookie("userId");
  const nbMessages = 10;

  const postData = {
    "userId":userId,
    "mail1":selfMail,
    "mail2":otherMail,
    "nbMessages":nbMessages
  }
  console.log(postData);

  // Options de la requête
  const requestOptions = {
    method: 'POST', // Méthode HTTP POST
    headers: {
        'Content-Type': 'application/json' // Indique que le corps de la requête est au format JSON
    },
    body: JSON.stringify(postData) // Convertit les données JSON en une chaîne JSON
};

// URL de l'endpoint de l'API
const url = 'http://localhost:3000/conversation/get';

console.log("tentative nouvelle conversation");
// Effectuer la requête POST avec l'API Fetch
fetch(url, requestOptions)
    .then(response => {
        // Vérifiez si la réponse est OK (status 200)
        if (response.ok) {
            console.log("Récuperation conversation réussie");
            return response.json();
        } else {
          return response.text().then(text => { throw new Error(text) });
        }
      })
    .then(async data => {
      console.log(data);
      for(let i = 0; i < data.length; i++) {
        await addMessage(otherMail, data[i].content, data[i].sender == selfMail);
      }
      return;
    })
    .catch(error => {
        // Gérez les erreurs d'envoi de la requête ou de traitement de la réponse
        console.error('Erreur : ', error);
    });

}

/*
  Créer une nouvelle fenetre de chat sur le front
  On renseigne le mail du destinataire et son propre mail
*/
async function newChat(selfMail, otherMail) {
  console.log("selfMail : "+selfMail);
  console.log("otherMail : "+otherMail);


  const postData = {
    "mail1" : selfMail,
    "mail2" : otherMail
  };

  // ----------- On teste si on peut créer une nouvelle conversation
  
  // Options de la requête
  const requestOptions = {
      method: 'POST', // Méthode HTTP POST
      headers: {
          'Content-Type': 'application/json' // Indique que le corps de la requête est au format JSON
      },
      body: JSON.stringify(postData) // Convertit les données JSON en une chaîne JSON
  };
  
  // URL de l'endpoint de l'API
  const url = 'http://localhost:3000/conversation/new';
  
  console.log("tentative nouvelle conversation");
  // Effectuer la requête POST avec l'API Fetch
  fetch(url, requestOptions)
      .then(response => {
          if (response.ok) {
              console.log("Envoi nouvelle conversation serveur réussi");
          } else {
            return response.text().then(text => { throw new Error(text) });
          }
      })
      .catch(error => {
          // Gérez les erreurs d'envoi de la requête ou de traitement de la réponse
          console.error('Erreur : ', error);
      });

  if(!document.getElementById(otherMail)) {
  
    const chat = document.getElementById("chat");
    const fieldContainer = document.getElementById("field-container");

    fieldContainer.innerHTML = ""
    chat.innerHTML = "";

    // Container du chat message
    const container = document.createElement("section");
    container.setAttribute("class", "nes-container with-title");
    container.setAttribute("id","chat-"+otherMail);
    container.style.margin = "5px";
    container.style.height = "100%";
    container.style.width = "98%";
    container.style.padding = "5px";
    
    // Titre du container (le destinataire des messages)
    const title = document.createElement("p");
    title.setAttribute("class","title");
    title.textContent = otherMail;
    container.appendChild(title);

    // Partie message, la ou tout les messages vont se stocker
    const msglist = document.createElement("section");
    msglist.setAttribute("class", "message-list");
    msglist.style.height = "100%";
    msglist.style.width = "100%";
    container.appendChild(msglist);

    const inputContainer = document.createElement("span");
    inputContainer.style.display = "flex";
    inputContainer.style.gap = "10px";
    inputContainer.style.margin = "15px";
    inputContainer.setAttribute("id","field-"+otherMail);

    // Div pour englober l'input pour ecrire des messages
    const chatDiv = document.createElement("div");
    chatDiv.setAttribute("class","nes-field");

    // Input pour ecrire des messages
    const chatField = document.createElement("input");
    chatField.setAttribute("class","nes-input limit-width chatField");
    chatField.type="text";
    chatField.style.width = "100%";

    chatField.addEventListener("keydown", function(event) {
      // Vérifie si la touche pressée est "Entrée" (code 13)
      if (event.key === "Enter" || event.keyCode === 13) {
        console.log("touche entrée appuyé, -> message");
        sendMessage(selfMail, otherMail); 
          // Empêche le comportement par défaut (souvent la soumission du formulaire)
          event.preventDefault();
          // Efface le champ de saisie
          chatField.value = "";
          // Vous pouvez également ajouter d'autres actions ici, si nécessaire
      }
    });

    inputContainer.append(chatField);

    const button = document.createElement("button");
    button.textContent = "Envoyer";
    button.setAttribute("class","nes-btn is-primary");

    button.onclick = sendMessage(selfMail, otherMail);
    inputContainer.appendChild(button);

    fieldContainer.appendChild(inputContainer);

    chat.appendChild(container);
    loadMessages(selfMail, otherMail);
  }
}

function scrollToBottom(mail) {
  const chatContainer = document.getElementById("chat-"+mail);
  const chat = chatContainer.querySelector(".message-list");

  chat.scrollTop += 500;
}

async function sendMessage(selfMail, otherMail) {
  var message;

  try {
    message = document.getElementById("field-"+otherMail).getElementsByClassName("chatField")[0].value;
    console.log("message : "+message);
  } catch(error) {
    console.log(error);
    return;
  }

  // Si ca n'est pas vide on envoie
  if(message != "") {
    var data = {
      "type":"message",
      "senderMail":selfMail,
      "receiverMail":otherMail,
      "message":message
    }
    data = JSON.stringify(data);
    socket.send(data);
  
    const postData = {
      "mail1" : selfMail,
      "mail2" : otherMail,
      "userId": await getCookie("userId"),
      "message": message
    };
    
    // Options de la requête
    const requestOptions = {
        method: 'POST', // Méthode HTTP POST
        headers: {
            'Content-Type': 'application/json' // Indique que le corps de la requête est au format JSON
        },
        body: JSON.stringify(postData) // Convertit les données JSON en une chaîne JSON
    };
    
    // URL de l'endpoint de l'API
    const url = 'http://localhost:3000/conversation/new-message';
    
    // Effectuer la requête POST avec l'API Fetch
    fetch(url, requestOptions)
        .then(response => {
            // Vérifiez si la réponse est OK (status 200)
            if (response.ok) {
                // Traitez la réponse
                console.log("-> "+message);
                addMessage(otherMail, message, true);
            }
            // Gérez les erreurs de réponse
            throw new Error('Erreur lors de la requête : ' + response.statusText);
        })
        .catch(error => {
            // Gérez les erreurs d'envoi de la requête ou de traitement de la réponse
            console.error('Erreur : ', error);
        });     
  }
}

/*
  Permet de demander a un utilisateur (défini par son mail) s'il souhaite démarrer une conversation
  A TERMINER (pas de demande réelle, ca crée directement le chat)
*/
function askChat(askerMail, askedMail) {
  const data = {
    "type":"ask-chat",
    "askerMail" : askerMail,
    "askedMail" : askedMail
  }

  console.log(data);
  const jsonData = JSON.stringify(data);
  console.log(jsonData);
  socket.send(jsonData);
}

/*
  Permet d'afficher l'utilisateur cherché dans la page chat
*/
async function displayUser() {

  document.getElementById("foundUser").innerHTML = "";

  const mail1 = await getCurrentMail();
  console.log("current mail : "+mail1);
  const mail2 = document.getElementById("searchText").value+"@etu.umontpellier.fr";

  res = await getServer("http://localhost:3000/users/search/mail/"+mail2);

  if(res != undefined) {
    res = await res.json();
    res = res[0];
    console.log(res.avatar);

    // On raffraichi la page pour avertir que l'on a bien trouvé l'utilisateur
    document.getElementById("searchRes").textContent = "Utilisateur trouvé !";
    document.getElementById("searchRes").className = "nes-text is-success";

    // Container de l'utilisateur trouvé
    const box = document.createElement("div");
    box.setAttribute("class","nes-container with-title");
    box.style.width = "auto";
    box.style.margin = "50px";

    console.log(res);
    console.log(res.avatar);
    const avatar = document.createElement("i");
    avatar.setAttribute("class","nes-"+res.avatar);

    // Titre du container, on utilise une fonction (capitalize...) pour mettre en majuscule la premiere lettre
    const title = document.createElement("p");
    title.setAttribute("class", "title");
    title.textContent = capitalizeFirstLetter(res.name) + " " + capitalizeFirstLetter(res.lastname);
    box.appendChild(title); 

    // Temoin d'état de connexion
    const statusBox = document.createElement("a");
    statusBox.setAttribute("class", "nes-badge");

    // Bouton pour contacter la personne
    const button = document.createElement("button");
    button.textContent = "Message";
    button.addEventListener("click", async function() {
      askChat(mail1, mail2);
    });

    // Span du badge
    const statusSpan = document.createElement("span");

    // On recupere l'état de connexion de l'utilisateur concerné
    const status = await getStatus(mail2);

    if(status) {
      statusSpan.setAttribute("class", "is-success");
      statusSpan.textContent = "Connecté";
      button.setAttribute("class", "nes-btn");
      statusBox.appendChild(statusSpan);
    } else {
      statusSpan.setAttribute("class", "is-error");
      statusSpan.textContent = "Déconnecté";
      button.setAttribute("class", "nes-btn is-disabled");
      statusBox.appendChild(statusSpan);
    }

    box.appendChild(statusBox);
    box.appendChild(document.createElement("br"));
    box.appendChild(avatar);
    box.appendChild(document.createElement("br"));
    box.appendChild(button);

    document.getElementById("foundUser").appendChild(box);
  
  } else {
    document.getElementById("searchRes").textContent = "Utilisateur inexistant";
    document.getElementById("searchRes").className = "nes-text is-error";
  }
}

function isConnectedToWebsocket() {
  return new Promise((resolve, reject) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
          // Si déjà connecté, résoudre immédiatement la promesse
          resolve();
      } else if(socket) {
          // Sinon, attendre que la connexion soit établie
          socket.addEventListener('open', () => {
              resolve();
          });

          // Gérer les erreurs de connexion
          socket.addEventListener('error', (error) => {
              reject(error);
          });
      }
  });
}

function getStatus(mail, callback) {
  return new Promise((resolve, reject) => {
    // Partie websocket pour connaitre le status de connexion de la personne trouvée
    const data = {
      "type":"ask-status",
      "askedMail" : mail
    }
    console.log(data)
    const jsonData = JSON.stringify(data);
    socket.send(jsonData);

  // Attendre la réponse du serveur
    socket.addEventListener('message', function (event) {
      var data = event.data;
      console.log("data : "+data);
      data = JSON.parse(data);

      if(data.type == "status") {
        if(data.mail == mail) {
          resolve(data.content == "true"); 
        }
      }
    });
});
}

// Fonction d'utilité publique aidant la mise en forme, met la premiere lettre du mot en entrée en majuscule
function capitalizeFirstLetter(string) {
  if (!string) return string; // Gérer les cas où la chaîne est vide ou null
  return string.charAt(0).toUpperCase() + string.slice(1);
}


// ------------------------- COMMUNES -------------------------
/*
 Permet de récupérer la valeur du cookie avec le nom indiqué
 getCookie(String) -> String | null
 getCookie("UserId") -> aA5bC-4g6...| null
*/
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

/*
  Renvoie le mail de l'utilisateur actuel
*/
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

/*
  Permet de se connecter au serveur websocket
  Transmet son mail afin d'etre identifié
*/

async function connectToWebsocket() {

  const mailUser = await getCurrentMail();
  console.log(mailUser);

  socket = new WebSocket('ws://localhost:8080/'+mailUser);

  socket.addEventListener('open', function (event) {
    console.log('Connecté au serveur WebSocket');
    return socket && socket.readyState === WebSocket.OPEN;
  });

  socket.addEventListener('message', async function (event) {
      var data = event.data;
      console.log("data : "+data);
      data = JSON.parse(data);
      switch (data.type) {
        case "message":
          console.log(data.content);
          addMessage(data.mail, data.message, false);
          var userData = await getServer("http://localhost:3000/users/search/mail/"+data.mail);
          userData = await userData.json();
          userData = await userData[0];
          console.log(userData);
          showNotification(capitalizeFirstLetter(await userData.name)+" "+capitalizeFirstLetter(await userData.lastname)+" vous a envoyé un message");
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

/*
  Permet d'envoyer des requetes au serveur de facon simplifié
*/
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

/*
  Permet de créer un cookie
*/
function createCookie(name, field, time) { // time in minute
  var e = null;
  var date = new Date ();
  date.setTime (date.getTime() + (time * 60 * 1000));
  e = "; expires=" + date.toGMTString();
  document.cookie = name + "=" + field + e + "; path=/";
}