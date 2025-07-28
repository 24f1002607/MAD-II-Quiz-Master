from flask import jsonify, request
from flask_security import auth_required, roles_required, current_user
from application.models import *
from application.database import db
from datetime import datetime

def register_user_routes(app):

    @app.route('/api/user/subject', methods=['GET'])
    @auth_required("token")  # Requires user to be logged in, no admin role needed
    def user_subject_list():
        from application.models import Subject
        user = current_user
        subjects = Subject.query.filter_by(level=user.qualification).all()
        return jsonify({
            "subjects": [
                {
                    "subject_id": s.subject_id,
                    "subject_name": s.subject_name,
                    "level": s.level if s.level else None
                } for s in subjects
            ]
        })

    @app.route("/api/user/subject/<int:subject_id>/quizzes")
    @auth_required("token")
    def get_quizzes_by_subject(subject_id):
        user = current_user
        subject = Subject.query.filter_by(subject_id=subject_id, level=user.qualification).first()

        if not subject:
            return jsonify({"quizzes": []})

        quizzes = Quiz.query.filter_by(subject_id=subject.subject_id).all()

        return jsonify({
            "quizzes": [{
                "quiz_id": quiz.quiz_id,
                "quiz_title": quiz.quiz_title,
                "chapter_name": quiz.chapter.chapter_name if quiz.chapter else '',
                "questions_count": len(quiz.questions),
                "difficulty_level": quiz.difficulty_level,
                "total_score": quiz.total_score,
                "duration": quiz.duration,
                "created_at": quiz.quiz_date.strftime('%Y-%m-%d') if quiz.quiz_date else ''
            } for quiz in quizzes]
        })





    @app.route('/api/user/dashboard', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def user_dashboard():
        user = current_user

        qualification = user.qualification  # e.g., "Foundation"
        subjects = Subject.query.filter_by(level=qualification).all()

        data = {
            "user": {
                "name": user.username,
                "email": user.email,
                "qualification": user.qualification
            },
            "quizzes_by_subject": {}
        }

        for subject in subjects:
            quizzes = Quiz.query.filter_by(subject_id=subject.subject_id).all()
            if not quizzes:
                continue  # skip subjects with no quizzes

            data["quizzes_by_subject"][subject.subject_name] = [
                {
                    "quiz_id": q.quiz_id,
                    "chapter_id": q.chapter_id,
                    "difficulty_level": q.difficulty_level,
                    "questions_count": q.questions_count,
                    "duration": q.duration
                }
                for q in quizzes
            ]

        return jsonify(data)

    #Route that fetches chapters by subject name
    @app.route('/api/subject/<string:subject_name>/chapters')
    @auth_required("token")
    def get_chapters_by_subject_name(subject_name):
        subject = Subject.query.filter_by(subject_name=subject_name).first()
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404

        chapters = Chapter.query.filter_by(subject_id=subject.subject_id).all()
        return jsonify({
            'chapters': [
                {'chapter_id': ch.chapter_id, 'chapter_name': ch.chapter_name} for ch in chapters
            ]
        })





    #Route for Viewing Quiz
    @app.route('/api/quiz/view/<int:quiz_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def view_quiz_details(quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        subject = Subject.query.get(quiz.subject_id)
        chapter = Chapter.query.get(quiz.chapter_id)

        return jsonify({
            "quiz_id": quiz.quiz_id,
            "quiz_title": quiz.quiz_title,
            "questions_count": quiz.questions_count,
            "difficulty": quiz.difficulty_level,
            "duration": quiz.duration,
            "total_score": quiz.total_score,
            "quiz_date": quiz.quiz_date.isoformat() if quiz.quiz_date else None,
            "subject": subject.subject_name if subject else "Unknown",
            "chapter": chapter.chapter_name if chapter else "Unknown"
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
