const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const os = require('os');


const http = require('http');
const url = require('url');


const axios = require('axios'); // Importez le module axios pour effectuer des requêtes HTTP

const loki_uri = process.env.LOKI || "http://127.0.0.1:3100";

const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");

const logger = createLogger({
  transports: [
    new LokiTransport({
      host: loki_uri
    })
  ]
});

//Important ici il faudra récupérer le username du fichier json
app.get('/loki',(req, res)=>{
    // Lire les informations du fichier JSON
    fs.readFile(jsonFilePath, 'utf8', (err,data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier JSON:', err);
            res.status(500).send('Erreur lors de la lecture du fichier JSON');
            return;
        }
        const userData = JSON.parse(data);
        // Parser les données JSON
    
        username = userData.username

        logger.info({ message: 'URL '+req.url , labels: { 'url': req.url, 'user':username } })

        //res.send("hello");
        next();
    })
    

});

/* TD auth2 step 1 : si l'utilisateur n'est pas connecté, alors on le redirige vers le micro-service d'authentification */
// Paramètres OpenID requis
const openIdParams = {
    clientid: 'your_client_id',
    scope: 'openid',
    redirect_uri: 'http://localhost:3000', // URL de redirection après l'authentification
    // Ajoutez d'autres paramètres OpenID requis ici
};

/*** Chemin du fichier texte contenant les mots ***/
// Chemin du dossier contenant le fichier .txt
const dossier = 'data';

// Nom du fichier .txt à importer
const nomFichier = 'liste_francais_utf8.txt';

// Chemin complet du fichier
const cheminFichier = path.join(dossier, nomFichier);


// Définir le chemin du fichier JSON
const jsonFilePath = path.join(__dirname, 'flask-auth', 'json_current_user_data.json');


/*** Fonction qui génère un nombre aléatoire selon la date ***/
function generateDailyRandomNumber() {
    const date = new Date();
    const seed = date.getFullYear() + (date.getMonth() + 1) + date.getDate();
    const random = Math.abs(Math.sin(seed)) * 10000;
    return Math.floor(random);
}

/*** Rendre les fichier du dossier "www" accessible***/
app.use(express.static('www'));

/** Rendre les fichiers du dossier flask-auth accessible en particulier le json current user */
app.use(express.static('flask-auth'));


/*** API ***/
/* FLECHE1: authentification shéma BENE*/
app.get('/', (res) => {
    res.redirect_uri('localhost:5000/login');
});

app.get('/wordOfTheDay', (req, res) => {
    // Lire le contenu du fichier
    fs.readFile(cheminFichier, 'utf8', (err, data) => {

        if (err) {
            console.error('Erreur lors de la lecture du fichier :', err);
            res.status(500).send('Erreur lors de la lecture du fichier');
            return;
        }

        // Diviser le contenu du fichier en mots
        const words = data.split(/\s+/);

        // Generate a daily random number
        const dailyRandomNumber = generateDailyRandomNumber();
        const selectedWordIndex = dailyRandomNumber % words.length;
        const wordOfTheDay = words[selectedWordIndex];

        res.send(wordOfTheDay);
    });
});

app.get('/word', (req, res) => {
    fs.readFile(cheminFichier, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier :', err);
            res.status(500).send('Erreur lors de la lecture du fichier');
            return;
        }

        const words = data.split(/\s+/);

        res.send(words);
    });
});

app.get('/port', (req, res) => {
    const hostname = os.hostname();
    const listeningPort = port;
    res.send(`MOTUS APP working on ${hostname} port ${listeningPort}`);
});

app.use(express.json());

/** AVEC fichier json */
/*
app.get('/', (req, res, next) => {
    // Lire les informations du fichier JSON
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier JSON:', err);
            res.status(500).send('Erreur lors de la lecture du fichier JSON');
            return;
        }

        // Parser les données JSON
        const userData = JSON.parse(data);

        const authenticated = userData.authenticated;
        console.log(authenticated);
        if (authenticated === false) {
            // Si l'utilisateur n'est pas authentifié, redirigez-le vers /login
            return res.redirect('localhost:3000/login');
        } else {
            // Si l'utilisateur est authentifié, redirigez-le vers index.html
            return res.redirect('index.html');
        }
    });
});
*/

/*
app.get('/notify_motus_js', (req, res) => {
    const userData = req.body; // Récupérer les données envoyées par Flask

    // Utilisez les données comme vous le souhaitez
    console.log('Notification reçue depuis app.py :'+JSON.parse(userData));
    
    // Répondre au serveur Flask si nécessaire
    // Par exemple, renvoyer un message de confirmation
    res.send('Notification reçue avec succès !');
});
*/

function sendCodeToScoreServer(code) {
    // URL du serveur Score.js
    const scoreServerUrl = 'http://localhost:3500/code_received';

    // Données à envoyer au serveur Score.js
    const data = {
        code: code
    };

    // Envoyer une requête POST au serveur Score.js avec le code
    axios.post(scoreServerUrl, data)
        .then(response => {
            // Traiter la réponse du serveur Score.js si nécessaire
            console.log('Response from Score server:', response.data);
        })
        .catch(error => {
            // Gérer les erreurs
            console.error('Error sending code to Score server:', error);
        });
}
/*FLECHE 3 de motus vers serveur score.js */
app.get('/get_code', (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    console.log(parsedUrl);
    if (parsedUrl.query.code) {
        console.log('Code récupéré:', parsedUrl.query.code);

        // Faites quelque chose avec le code récupéré ici
        /*
        res.send(`Code récupéré : ${parsedUrl.query.code}`);
        res.redirect()
        */
        //Envoyer le code au serveur Score.js
        sendCodeToScoreServer(parsedUrl.query.code);

        // Envoyer une réponse au client si nécessaire
        res.send(`Code récupéré : ${parsedUrl.query.code}`);
    } else {
        // Traitez le cas où aucun code n'est trouvé dans les paramètres de l'URL
        console.log('Aucun code trouvé dans les paramètres de l\'URL.');
        res.send('Aucun code trouvé dans les paramètres de l\'URL.');
    }
});


/*
app.get('/login', (req, res) => {
    // Lire les informations du fichier JSON
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier JSON:', err);
            res.status(500).send('Erreur lors de la lecture du fichier JSON');
            return;
        }

        // Parser les données JSON
        const userData = JSON.parse(data);

        const authenticated = userData.authenticated;
        console.log(authenticated);
        if (authenticated === false) {
            // Si l'utilisateur n'est pas authentifié, redirigez-le vers localhost:5000
            res.redirect('http://localhost:5000/');
            // Si l'utilisateur est authentifié, redirigez-le vers index.html
            res.redirect('index.html');
        }
        if(authenticated === true){
            // Si l'utilisateur est authentifié, redirigez-le vers index.html
            res.redirect('index.html');
        }
    });
});*/

// on s'en fou
/*
app.get('/get_user_ticket', (req, res) => {
    // Lire les informations du fichier JSON
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier JSON:', err);
            res.status(500).send('Erreur lors de la lecture du fichier JSON');
            return;
        }

        // Parser les données JSON
        const userData = JSON.parse(data);
        console.log(userData.user_ticket);
        // Renvoyer les informations de l'utilisateur en tant que réponse
        res.json('Hello user, here is your ticket:'+userData.user_ticket);
    });
});
*/

// Le serveur écoute sur le port 3000
app.listen(port, () => {
    console.log('Server is running on port 3000');
});
