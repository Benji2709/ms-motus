const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3500;

app.use(express.json());

// Route pour recevoir le code du serveur Motus
app.post('/code_received', (req, res) => {
    // Récupérer le code envoyé par le serveur Motus
    const code = req.body.code;

    // Faites quelque chose avec le code récupéré
    console.log('Code received from Motus server:', code);

    // Envoyer le code au serveur d'authentification
    const authenticationServerUrl = 'http://localhost:5000/token';
    axios.post(authenticationServerUrl, { code })
        .then(response => {
            // Traiter la réponse du serveur d'authentification si nécessaire
            console.log('Response from authentication server:', response.data.username);
        })
        .catch(error => {
            // Gérer les erreurs
            console.error('Error sending code to authentication server:', error);
            res.status(500).send('Failed to send code to authentication server');
        });
});

// Démarrer le serveur sur le port spécifié
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
