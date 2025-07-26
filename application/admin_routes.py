from flask import jsonify, request
from flask_security import auth_required, roles_required
from application.models import User, Subject, Chapter, Quiz, Questions
from application.database import db
from datetime import datetime

def register_admin_routes(app):

    @app.route('/api/admin-dashboard', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def admin_dashboard():
        users = User.query.all()
        subjects = Subject.query.all()
        quizzes = Quiz.query.all()
        return jsonify({
            "users": [{"id": u.id, "username": u.username, "email": u.email, "active": u.active, "roles": [r.name for r in u.roles]} for u in users],
            "subjects": [{"subject_id": s.subject_id, "subject_name": s.subject_name, "level": s.level if s.level else None} for s in subjects],
            "quizzes": [{"id": q.quiz_id, "title": q.quiz_title} for q in quizzes]
        })

    @app.route('/api/logout', methods=['POST'])
    @auth_required("token")
    def admin_logout():
        from flask_security import logout_user
        logout_user()
        return jsonify({"message": "Logged out successfully."})

    @app.route('/api/user/block/<int:user_id>', methods=['POST'])
    @auth_required("token")
    @roles_required("admin")
    def block_user(user_id):
        user = User.query.get(user_id)
        if user:
            user.active = False
            db.session.commit()
            return jsonify({"message": "User blocked"})
        return jsonify({"message": "User not found"}), 404

    @app.route('/api/user/unblock/<int:user_id>', methods=['POST'])
    @auth_required("token")
    @roles_required("admin")
    def unblock_user(user_id):
        user = User.query.get(user_id)
        if user:
            user.active = True
            db.session.commit()
            return jsonify({"message": "User unblocked"})
        return jsonify({"message": "User not found"}), 404

    @app.route('/api/subject', methods=['GET', 'POST'])
    @app.route('/api/subject/<int:subject_id>', methods=['PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def subject_api(subject_id=None):
        if request.method == 'GET':
            subjects = Subject.query.all()
            return jsonify({
                "subjects": [
                    {"subject_id": s.subject_id, "subject_name": s.subject_name, "level": s.level if s.level else None}
                    for s in subjects
                ]
            })
        elif request.method == 'POST':
            data = request.json
            new_subject = Subject(subject_name=data['subject_name'], level=data['level'])
            db.session.add(new_subject)
            db.session.commit()
            return jsonify({"message": "Subject created"}), 201
        elif request.method == 'PUT':
            subject = Subject.query.get(subject_id)
            if subject:
                data = request.json
                subject.subject_name = data.get("subject_name", subject.subject_name)
                subject.level = data.get("level", subject.level)
                db.session.commit()
                return jsonify({"message": "Subject updated"})
            return jsonify({"message": "Subject not found"}), 404
        elif request.method == 'DELETE':
            subject = Subject.query.get(subject_id)
            if subject:
                db.session.delete(subject)
                db.session.commit()
                return jsonify({"message": "Subject deleted"})
            return jsonify({"message": "Subject not found"}), 404
        
    @app.route('/api/subject/<int:subject_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def get_subject(subject_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({"message": "Subject not found"}), 404
        return jsonify({
            "subject": {
                "subject_name": subject.subject_name,
                "level": subject.level
            }
        })


    @app.route('/api/chapter', methods=['GET', 'POST'])
    @app.route('/api/chapter/<int:chapter_id>', methods=['GET', 'PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def chapter_api(chapter_id=None):
        if request.method == 'GET':
            if chapter_id:
                # Get a single chapter by ID
                chapter = Chapter.query.get(chapter_id)
                if not chapter:
                    return jsonify({"error": "Chapter not found"}), 404
                return jsonify({
                    "chapter": {
                        "chapter_id": chapter.chapter_id,
                        "chapter_name": chapter.chapter_name,
                        "chapter_description": chapter.chapter_description,
                        "subject_id": chapter.subject_id
                    }
                })

            # Otherwise, list all chapters for a given subject_id
            subject_id = request.args.get("subject_id")
            if not subject_id:
                return jsonify({"error": "subject_id is required"}), 400

            chapters = Chapter.query.filter_by(subject_id=subject_id).all()
            return jsonify([
                {
                    "chapter_id": c.chapter_id,
                    "chapter_name": c.chapter_name,
                    "chapter_description": c.chapter_description
                } for c in chapters
            ])

        elif request.method == 'POST':
            data = request.json
            new_chapter = Chapter(
                subject_id=data['subject_id'],
                chapter_name=data['chapter_name'],
                chapter_description=data.get('description', '')
            )
            db.session.add(new_chapter)
            db.session.commit()
            return jsonify({"message": "Chapter created", "chapter_id": new_chapter.chapter_id})

        elif request.method == 'PUT':
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return jsonify({"error": "Chapter not found"}), 404

            data = request.json
            chapter.chapter_name = data.get("chapter_name", chapter.chapter_name)
            chapter.chapter_description = data.get("description", chapter.chapter_description)
            db.session.commit()
            return jsonify({"message": "Chapter updated"})

        elif request.method == 'DELETE':
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return jsonify({"error": "Chapter not found"}), 404

            db.session.delete(chapter)
            db.session.commit()
            return jsonify({"message": "Chapter deleted"})

    @app.route('/api/quiz', methods=['POST'])
    @app.route('/api/quiz/<int:quiz_id>', methods=['PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def quiz_api(quiz_id=None):
        if request.method == 'POST':
            data = request.json
            new_quiz = Quiz(
                chapter_id=data['chapter_id'],
                quiz_title=data['title'],
                quiz_date=datetime.strptime(data['quiz_date'], "%Y-%m-%d"),
                questions_count=data['questions_count'],
                duration=data['duration'],
                difficulty_level=data['difficulty'],
                total_score=0
            )
            new_quiz.set_total_score()
            db.session.add(new_quiz)
            db.session.commit()
            return jsonify({"message": "Quiz created"})
        elif request.method == 'PUT':
            quiz = Quiz.query.get(quiz_id)
            if quiz:
                data = request.json
                quiz.quiz_title = data.get("title", quiz.quiz_title)
                quiz.difficulty_level = data.get("difficulty", quiz.difficulty_level)
                quiz.set_total_score()
                db.session.commit()
                return jsonify({"message": "Quiz updated"})
            return jsonify({"message": "Quiz not found"}), 404
        elif request.method == 'DELETE':
            quiz = Quiz.query.get(quiz_id)
            if quiz:
                db.session.delete(quiz)
                db.session.commit()
                return jsonify({"message": "Quiz deleted"})
            return jsonify({"message": "Quiz not found"}), 404

    @app.route('/api/quiz/view/<int:quiz_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def view_edit_quiz(quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"message": "Quiz not found"}), 404
        return jsonify({
            "title": quiz.quiz_title,
            "duration": quiz.duration,
            "difficulty": quiz.difficulty_level,
            "questions": [{"id": q.question_id, "text": q.question_text} for q in quiz.questions]
        })

    @app.route('/api/question', methods=['POST'])
    @app.route('/api/question/<int:question_id>', methods=['PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def question_api(question_id=None):
        if request.method == 'POST':
            data = request.json
            new_q = Questions(**data)
            db.session.add(new_q)
            db.session.commit()
            return jsonify({"message": "Question created"})
        elif request.method == 'PUT':
            q = Questions.query.get(question_id)
            if not q:
                return jsonify({"message": "Question not found"}), 404
            for key, val in request.json.items():
                setattr(q, key, val)
            db.session.commit()
            return jsonify({"message": "Question updated"})
        elif request.method == 'DELETE':
            q = Questions.query.get(question_id)
            if q:
                db.session.delete(q)
                db.session.commit()
                return jsonify({"message": "Question deleted"})
            return jsonify({"message": "Question not found"}), 404

    @app.route('/api/admin/search', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def admin_search():
        q = request.args.get("q", "")
        users = User.query.filter(User.username.contains(q)).all()
        subjects = Subject.query.filter(Subject.subject_name.contains(q)).all()
        quizzes = Quiz.query.filter(Quiz.quiz_title.contains(q)).all()
        return jsonify({
            "users": [{"id": u.id, "username": u.username} for u in users],
            "subjects": [{"id": s.subject_id, "name": s.subject_name} for s in subjects],
            "quizzes": [{"id": quiz.quiz_id, "title": quiz.quiz_title} for quiz in quizzes]
        })
