from app import app, db  # Importez l'application Flask et l'instance SQLAlchemy

# Créez le contexte de l'application Flask
with app.app_context():
    # Créez toutes les tables dans la base de données
    db.create_all()
