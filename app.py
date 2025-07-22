from flask import Flask
from application.database import db
from application.models import User, Role
from application.resources import *
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security import hash_password
from random import choice
from werkzeug.security import check_password_hash, generate_password_hash



def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)
    api.init_app(app)
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    app.app_context().push()
    return app


app = create_app()

# List of allowed qualifications excluding "Admin"
non_admin_qualifications = [
    "Foundation",
    "Diploma Data Science",
    "Diploma Programming",
    "Degree BSc",
    "Degree BS"
]


with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin", description = "Superuser of app")
    app.security.datastore.find_or_create_role(name = "user", description = "General user of app")
    db.session.commit()
    if not app.security.datastore.find_user(email = "user0@admin.com"):
        app.security.datastore.create_user(email = "user0@admin.com",
                                           username = "admin01",
                                           password = generate_password_hash("1234"), 
                                           qualification = "Admin",
                                           roles = ['admin', 'user'])
        
    #if not app.security.datastore.find_user(email = "user1@user.com"):
        #app.security.datastore.create_user(email = "user1@user.com",
                                           #username = "user01",
                                           #password = hash_password("1234"),
                                           #qualification = choice(non_admin_qualifications),
                                           #roles = ['user'])
    db.session.commit()

from application.routes import *

if __name__ =="__main__":
    app.run()

#Authentication


#RBAC