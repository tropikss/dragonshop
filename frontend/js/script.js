
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
          const name = data.name;
          const lasname = data.lastname;
          const mail = data.mail;
          const password = data.password;

          document.getElementById("toggleInfo").style.display = "block";
          document.getElementById("resName").textContent = name;
          document.getElementById("resLastname").textContent = lastname;
          document.getElementById("resMail").textContent = mail;
          document.getElementById("resPassword").textContent = password;
          document.getElementById("resText").textContent = "Inscription réussie";
        }) 
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}