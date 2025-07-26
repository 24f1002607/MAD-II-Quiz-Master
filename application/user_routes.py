from flask import jsonify, request
from flask_security import auth_required, roles_required, current_user
from application.models import User_Quiz_Attempt
from application.database import db
from datetime import datetime

def register_user_routes(app):

    @app.route('/api/user-dashboard', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def user_dashboard():
        user = current_user
        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "qualification": user.qualification,
            "roles": [role.name for role in user.roles] if user.roles else []
        })

    @app.route('/api/quiz/start/<int:quiz_id>', methods=['POST'])
    @auth_required("token")
    @roles_required("user")
    def start_quiz(quiz_id):
        attempt = User_Quiz_Attempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            attempt_date=datetime.utcnow(),
            selected_answers={}
        )
        db.session.add(attempt)
        db.session.commit()
        return jsonify({
            "message": "Quiz started",
            "attempt_id": attempt.attempt_id
        })

    @app.route('/api/quiz/submit/<int:attempt_id>', methods=['POST'])
    @auth_required("token")
    @roles_required("user")
    def submit_quiz(attempt_id):
        data = request.json
        attempt = User_Quiz_Attempt.query.get(attempt_id)
        if not attempt or attempt.user_id != current_user.id:
            return jsonify({"message": "Not allowed"}), 403

        attempt.completed_at = datetime.utcnow()
        attempt.selected_answers = data.get("answers", {})
        attempt.score = attempt.calculate_score(attempt.selected_answers)
        db.session.commit()
        return jsonify({
            "message": "Quiz submitted",
            "score": attempt.score
        })

    @app.route('/api/quiz/results', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def view_results():
        attempts = User_Quiz_Attempt.query.filter_by(user_id=current_user.id).all()
        return jsonify([
            {
                "quiz_id": a.quiz_id,
                "score": a.score,
                "attempt_date": a.attempt_date.isoformat()
            } for a in attempts
        ])
