from flask import current_app as app, jsonify, render_template, request
from flask_security import auth_required, roles_required, current_user, login_user
from application.models import User,Role, UsersRoles, Subject, Chapter, Quiz, Questions, User_Quiz_Attempt 
from application.database import db
from datetime import datetime, timezone
from werkzeug.security import check_password_hash, generate_password_hash


#entry point of the app where the app loads 
@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')



##User based routes
#- /api/home - user dashboard
#- /api/admin - admin dashboard
#- /api/registration - user registration


##Chapter, Subject, Quiz and Question based routes - using restful API's

#- /api/get
# /api/create
# /api/update
# /api/delete





@app.route("/api/admin")
@auth_required('token') #Authentication
@roles_required('admin') #RBAC/ Authorisation
def admin_home():
    return jsonify({
        "message": "Admin has logged in"
    })

@app.route('/api/home')
@auth_required('token')
@roles_required('user') #and (['user', 'admin'])
#@roles_accepted(['user', 'admin']) OR
def user_home():
    user = current_user
    return jsonify({
        "username": user.username,
        "email": user.email,
        "password": user.password
    })


@app.route('/api/login', methods=['POST'])
def user_login():
    body = request.get_json()
    email = body['email']
    password = body['password']

    if not email:
        return jsonify({"message": "Email is required"}), 400
    
    user = app.security.datastore.find_user(email = email)

    if user:
        if check_password_hash(user.password, password):
            #if current_user: (not required in front end)
                #return jsonify({"message": "User already logged in"}), 400
            login_user(user)
            return jsonify({
                "id": user.id,
                "username": user.username,
                "auth_token": user.get_auth_token()
            })
        else:
            return jsonify({"message": "Invalid password"}), 400
    else:
        return jsonify({"message": "User not found"}), 404


@app.route('/api/register', methods=['POST'])
def create_user():
    credentials = request.get_json()
    if not app.security.datastore.find_user(email = credentials["email"] ):
        app.security.datastore.create_user(email = credentials["email"],
                                           username = credentials["username"],
                                           password = generate_password_hash(credentials["password"]),
                                           qualification = credentials["qualification"],
                                           roles = ['user'])
        db.session.commit()
        return jsonify({"message": "User created suscessfully"}), 201
    else:
        return jsonify({"message": "User already exists"}), 400
    





