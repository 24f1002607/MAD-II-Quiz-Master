from flask import jsonify, render_template, request
from flask_security import login_user
from werkzeug.security import check_password_hash, generate_password_hash
from application.database import db
from uuid import uuid4

def register_auth_routes(app):
    @app.route('/', methods=['GET'])
    def home():
        return render_template('index.html')

    @app.route('/api/login', methods=['POST'])
    def user_login():
        body = request.get_json()
        email = body.get('email')
        password = body.get('password')

        if not email:
            return jsonify({"message": "Email is required"}), 400

        user = app.security.datastore.find_user(email=email)
        if user and check_password_hash(user.password, password):
            login_user(user)
            roles = [r.name for r in user.roles] if user.roles else []
            return jsonify({
                "id": user.id,
                "username": user.username,
                "auth_token": user.get_auth_token(),
                "qualification": user.qualification,
                "roles": roles
            })
        return jsonify({"message": "Invalid credentials"}), 400

    @app.route('/api/register', methods=['POST'])
    def create_user():
        credentials = request.get_json()
        if not app.security.datastore.find_user(email=credentials["email"]):
            app.security.datastore.create_user(
                email=credentials["email"],
                username=credentials["username"],
                password=generate_password_hash(credentials["password"]),
                qualification=credentials.get("qualification", ""),
                fs_uniquifier=str(uuid4()),
                roles=["user"]
            )
            db.session.commit()
            return jsonify({"message": "User created successfully"}), 201
        return jsonify({"message": "User already exists"}), 400

    # Catch-all route for all other non-API paths to serve index.html for Vue router history mode
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        # Skip API routes
        if path.startswith('api'):
            return jsonify({"message": "API route not found"}), 404
        return render_template('index.html')
