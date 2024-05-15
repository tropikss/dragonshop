// Importer la bibliothèque 'ws'
const WebSocket = require('ws');

// Créer un nouveau serveur WebSocket sur le port 8080
const wss = new WebSocket.Server({ port: 8080 });

const connections = new Map();

wss.on('connection', (ws, req) => {
    const mail1 = req.url.substring(1);

    connections.set(mail1, ws);
    console.log("-> "+mail1);

    ws.on('message', (message) => {
        var data = message.toString('utf8');
        console.log(data);
        data = JSON.parse(data); // bien penser a parse quand on a recu des donnée en texte json
        console.log(data.type);

        if(data.type == "message") {
            const senderMail = data.senderMail;
            const receiverMail = data.receiverMail;
            const message = data.message;

            const senderws = connections.get(senderMail);
            const receiverws = connections.get(receiverMail);

            if(senderws && receiverws) {
                console.log("deux destinataires trouvés");
                var receiverData = {
                    "type":"message",
                    "message":message,
                    "mail":senderMail
                }

                receiverData = JSON.stringify(receiverData);
                receiverws.send(receiverData);
            } else {
                console.log("manque un des destinataires");
            }

        } else if(data.type == "ask-chat") { // demande de communication avec un utilisateur
            const askerMail = data.askerMail;
            const askedMail = data.askedMail;

            const askerws = connections.get(askerMail);
            const askedws = connections.get(askedMail);

            if(askerws && askedws) {
                console.log("Correspondants ok");
                var askerData = {
                    "type":"chat-accept",
                    "mail":askedMail
                }
                var askedData = {
                    "type":"chat-accept",
                    "mail":askerMail
                }
                askerData = JSON.stringify(askerData);
                askedData = JSON.stringify(askedData);

                askerws.send(askerData);
                askedws.send(askedData)
            } else {
                console.log("Manque un des deux correspondants");
            }
        }
    });
    
    ws.on('close', () => {
        console.log('Connexion WebSocket fermée.');
    });
});
