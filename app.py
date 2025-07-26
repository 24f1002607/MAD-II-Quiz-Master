from flask import Flask, jsonify, request, redirect, url_for, render_template, g, abort
from application.database import db
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# Import route functions (not blueprints)
from application.auth_routes import register_auth_routes
from application.admin_routes import register_admin_routes
from application.user_routes import register_user_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)

    datastore = SQLAlchemyUserDatastore(db, User, Role)
    security = Security(app, datastore)
    app.security = security

    def unauthorized_callback():
        if request.accept_mimetypes.accept_json or request.path.startswith('/api'):
            return jsonify({"error": "Unauthorized access"}), 401
        return redirect(url_for('security.login'))

    app.security.login_manager.unauthorized_handler(unauthorized_callback)

    # Register routes
    register_auth_routes(app)
    register_admin_routes(app)
    register_user_routes(app)

    with app.app_context():
        db.create_all()

        datastore.find_or_create_role(name="admin", description="Superuser of app")
        datastore.find_or_create_role(name="user", description="General user of app")
        db.session.commit()

        if not datastore.find_user(email="admin@example.com"):
            datastore.create_user(
                email="admin@example.com",
                username="admin01",
                password=generate_password_hash("24F1002607"),
                qualification="Admin",
                roles=["admin", "user"]
            )
        db.session.commit()

    return app

app = create_app()

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authentication-Token')
        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        user = User.verify_auth_token(token)
        if not user:
            return jsonify({"message": "Invalid or expired token!"}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated

@app.route('/api/token', methods=['POST'])
def get_token():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password required"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    if not check_password_hash(user.password, data['password']):
        return jsonify({"message": "Incorrect password"}), 401

    token = user.get_auth_token()
    return jsonify({"token": token})


@app.route('/api/protected', methods=['GET'])
@token_required
def protected():
    user = g.current_user
    return jsonify({"message": f"Hello {user.username}, you have accessed a protected route!"})


# Catch-all route for frontend Vue Router
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_vue_spa(path):
    # Let API routes return normal error if not found
    if path.startswith('api/') or path.startswith('static/') or '.' in path:
        return abort(404)
    return render_template('index.html')

# Error handler
@app.errorhandler(500)
def handle_500(e):
    return jsonify({
        "error": "Internal Server Error",
        "message": str(e)
    }), 500

if __name__ == "__main__":
    app.run(debug=True)
