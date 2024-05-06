
//const bcryptjsjs = require('bcryptjsjsjs');
// Dragonshop38

// TYPES : 

class User {
  constructor(name, lastname, mail, password) {
      this.name = name;
      this.lastname = lastname;
      this.mail = mail;
      this.password = password;
  }
}

// -----

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

async function userInfo() {
  if (document.cookie.includes('userId')) {
    console.log('Le cookie userId est présent.');
    const userId = getCookie("userId");
    console.log(userId);

    var res = await getServer("http://localhost:3000/users/search/userId/"+userId);
    console.log(res);

    if(res != undefined) {
      res = (await res.json())[0];
      console.log(res);

      const resText = document.createElement("p");
      resText.textContent = "Bienvenue "+res.name+" !";

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
      
      const button = document.createElement("button");
      button.setAttribute("onclick", "logout()");
      button.textContent = "Déconnexion";
      document.getElementById("logButton").appendChild(button);    
    }
  } else {
    console.log('Le cookie userId n\'est pas présent.');
    const temp = document.createElement("p");
    temp.textContent = "Vous n'etes pas connecté";
    document.getElementById("userInfo").appendChild(temp);

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

async function searchUser() {
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

    res.forEach(el => {
      const box = document.createElement("div");
      box.style.border = "1px solid black";

      const name = document.createElement("div");
      name.textContent = "Prenom : "+el.name;

      const lastname = document.createElement("div");
      lastname.textContent = "Nom : "+el.lastname;

      const mail = document.createElement("div");
      mail.textContent = "Mail : "+el.mail;

      box.appendChild(name);
      box.appendChild(lastname);
      box.appendChild(mail);
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