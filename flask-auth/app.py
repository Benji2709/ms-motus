from flask import Flask, render_template ,redirect ,url_for, session, jsonify, flash, request
from flask_sqlalchemy import SQLAlchemy
from  flask_login import UserMixin, LoginManager, login_user, login_required,logout_user,current_user
from flask_wtf import FlaskForm
from wtforms import StringField,PasswordField,SubmitField
from wtforms.validators import InputRequired, Length, ValidationError
from flask_bcrypt import Bcrypt
from secrets import token_urlsafe
import json
import random
import string

#fichier super important : 
json_file = 'json_current_user_data.json'

data = {}

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Pour désactiver le suivi des modifications SQLAlchemy
app.config['SECRET_KEY'] = 'thisisasecretkey'  

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)#chaque personne a un username différent
    password = db.Column(db.String(20), nullable=False)
    #colonne pour le ticket de l'utilisateur pour ensuite récupérer son score dans l'appli score
    ticket = db.Column(db.String(20),nullable=False, unique=True)

class RegisterForm(FlaskForm):
    username = StringField(validators=[InputRequired(),Length(
        min=4,max=20)], render_kw={"placeholder":"username"}
    )
    password = PasswordField(validators=[InputRequired(),Length(
        min=4,max=20)], render_kw={"placeholder":"password"}
    )
    submit = SubmitField("Register")

    def validate_username(self,username):
        existing_use_username = User.query.filter_by(username=username.data).first()
        if existing_use_username : 
            raise ValidationError("That username already exists in the database. Please choose another username")

class LoginForm(FlaskForm):
    username = StringField(validators=[InputRequired(),Length(
        min=4,max=20)], render_kw={"placeholder":"username"}
    )
    password = PasswordField(validators=[InputRequired(),Length(
        min=4,max=20)], render_kw={"placeholder":"password"}
    )
    submit = SubmitField("Login")


@app.route('/')
def home():
    return render_template('home.html')

#avec json file
"""
@app.route('/login',methods=['GET','POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username = form.username.data).first()
        if bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user)
            #return redirect(url_for('dashboard'))
            #modif-------------------------------
            #si l'authentication est successfull
            session['authenticated'] = True
            data = {
            "message": "notification from app.py",
            "username": current_user.username,
            "user_ticket": current_user.ticket,
            "authenticated": True
            }
            # Écrire les données dans un fichier JSON
            json_file = 'json_current_user_data.json'
            with open(json_file, 'w') as file:
                json.dump(data, file)
            return redirect(url_for('dashboard'))
    return render_template('login.html',form=form)
"""

#FLECHE NUM 2 SCHEMA BENE
#sans json file
#variable globale pour stocker le code de l'utilisateur
generated_codes = {}
@app.route('/login',methods=['GET','POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username = form.username.data).first()
        if bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user)
            # Si l'authentification réussit, générez un code aléatoire
            #code = ''.join(random.choices(string.digits, k=3))

            # Stocker le code généré avec le nom d'utilisateur dans la variable generated_codes
            #generated_codes[user.username] = code

            # Rediriger l'utilisateur vers l'application le dashboard avec le code généré en tant que paramètre d'URL
            redirect_uri = 'dashboard'  # L'URI de redirection de l'application Motus
            return redirect(f'{redirect_uri}?code={current_user.ticket}')
    else:# Si l'authentification échoue, afficher un message d'erreur et rediriger vers la page de connexion
        flash('Invalid username or password. Please try again.', 'error')
        return render_template('login.html',form=form)

@app.route('/go_to_motus',methods=['GET','POST'])
@login_required
def go_to_motus_app():
    # Rediriger l'utilisateur vers l'application le dashboard avec le code généré en tant que paramètre d'URL
    code = current_user.ticket
    # Construire l'URL de redirection avec le code
    redirect_url = f'http://localhost:3000/?code={code}'
    return redirect(redirect_url)

@app.route('/dashboard',methods=['GET','POST'])
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/logout',methods=['GET','POST'])
@login_required
def logout():
    logout_user()
    session['authenticated'] = False

    # Mettre à jour les données de l'utilisateur déconnecté
    data = {
        'authenticated': False,
        'message': 'User logged out successfully'
    }
    print(data)
    """
    # Écrire les données mises à jour dans le fichier JSON
    json_file = 'json_current_user_data.json'
    with open(json_file, 'w') as file:
        json.dump(data, file)

    return redirect(url_for('login'))
    """


# Route pour récupérer le ticket de l'utilisateur
"""
@app.route('/get_user_ticket', methods=['GET','POST'])
@login_required
def get_user_ticket():
    if current_user.is_authenticated:
        user_data = {
            "message": "notification from app.py",
            "username": current_user.username,
            "user_ticket": current_user.ticket,
            "authenticated": True
        }
        # Retourner les données en tant que réponse JSONsonify(data)
        # ret redirect callback?code=ticket
        return jsonify(user_data)
"""

#ancienne fonction pour générer le ticket utilisateur
"""
def generate_user_ticket():
    return token_urlsafe(16)
"""

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()

    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data)
        new_user = User(username=form.username.data, password=hashed_password,ticket = ''.join(random.choices(string.digits, k=3)))
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))  # Redirection vers la vue 'login'

    return render_template('register.html', form=form)

#fonction pour notifier motus.js que l'authentification est réussie
"""
@app.route('/notify_motus_js', methods=['GET','POST'])
def notify_motus_js():
    if session.get('authenticated'):
        # Authentification réussie, renvoyer le code de statut HTTP 200 et le ticket de l'utilisateur
        user_ticket = current_user.ticket  # Supposons que vous utilisez Flask-Login pour gérer l'utilisateur actuel
        #return user_ticket, 200
        data = {
            "message": "notification from app.py",
            "username": current_user.username,
            "user_ticket": user_ticket,
            "authenticated": True
        }
        return jsonify(data)
        # Écrire les données dans un fichier JSON
        json_file = 'json_current_user_data.json'
        with open(json_file, 'w') as file:
            json.dump(data, file)
        S
    else:
        # Authentification échouée, renvoyer le code de statut HTTP 401
        return 401

"""

"""   
@app.route('/token', methods=['GET','POST'])
    get code Param 
        read file code
        code  ==> User
    return jsonify(User : MonuserDansLe fichier)
"""
@app.route('/token', methods=['POST'])
def token():
    # Récupérer le code envoyé depuis le serveur Score
    code = request.json.get('code')

    # Vérifier si le code a été envoyé
    if code:
        # Trouver l'utilisateur correspondant dans la base de données en utilisant le code
        user = User.query.filter_by(ticket=code).first()

        # Vérifier si l'utilisateur a été trouvé
        if user:
            # Retourner les informations de l'utilisateur en tant que réponse JSON
            return jsonify({
                'username': user.username
                # Ajoutez d'autres informations de l'utilisateur que vous souhaitez retourner
            }), 200
        else:
            # Si aucun utilisateur correspondant n'est trouvé, retourner un message d'erreur
            return jsonify({'error': 'User not found'}), 404
    else:
        # Si aucun code n'a été envoyé, retourner un message d'erreur
        return jsonify({'error': 'Code not provided'}), 400

if __name__ == '__main__':
    app.run(debug=True)