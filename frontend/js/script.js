
//const bcryptjsjs = require('bcryptjsjsjs');

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

      document.getElementById("resUser").textContent = "Bienvenue "+res.name + " !";
      document.getElementById("resUser").style.color = "green";
      document.getElementById("resUser").style.fontWeight = "bold";

      document.getElementById("userName").textContent = "Prenom : "+res.name;
      document.getElementById("userLastname").textContent = "Nom : "+res.lastname;
      document.getElementById("userMail").textContent = "Mail : "+res.mail;

    }
  } else {
    console.log('Le cookie userId n\'est pas présent.');
    document.getElementById("resUser").textContent = "Vous n'etes pas connecté";
  }
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
    const name = document.getElementById("name").value;
    const lastname = document.getElementById("lastname").value;
    const mail = document.getElementById("mail").value;
    const password = document.getElementById("password").value;
    const passwordConfirmation = document.getElementById("passwordConfirmation").value;

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
            if (!response.ok) {
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