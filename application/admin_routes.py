from flask import jsonify, request
from flask_security import auth_required, roles_required
from application.models import User, Subject, Chapter, Quiz, Questions, User_Quiz_Attempt, is_valid_duration
from application.database import db
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import joinedload


def register_admin_routes(app):

    @app.route('/api/admin-dashboard', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def admin_dashboard():
        users = User.query.options(
            joinedload(User.quiz_attempts)
            .joinedload(User_Quiz_Attempt.quiz)
            .joinedload(Quiz.subject)
        ).all()
        subjects = Subject.query.all()
        quizzes = Quiz.query.all()

        return jsonify({
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "qualification": u.qualification,
                    "active": u.active,
                    "roles": [r.name for r in u.roles],
                    "quiz_attempts": [
                        {
                            "subject": a.quiz.subject.subject_name if a.quiz and a.quiz.subject else "N/A",
                            "quiz_id": a.quiz_id,
                            "attempt_id": a.attempt_id,
                            "attempt_date": a.attempt_date.isoformat() if a.attempt_date else None,
                            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                            "difficulty_level": a.quiz.difficulty_level if a.quiz else "Unknown",
                            "score": a.score
                        }
                        for a in u.quiz_attempts
                        if a.completed_at is not None
                    ]
                }
                for u in users
                if "admin" not in [r.name for r in u.roles]
            ],
            "subjects": [
                {
                    "subject_id": s.subject_id,
                    "subject_name": s.subject_name,
                    "level": s.level if s.level else None
                } for s in subjects
            ],
            "quizzes": [
                {
                    "id": q.quiz_id,
                    "title": q.quiz_title
                } for q in quizzes
            ]
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

    # CRUD for subjects including quiz_count in GET
    @app.route('/api/subject', methods=['GET', 'POST'])
    @app.route('/api/subject/<int:subject_id>', methods=['PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def subject_api(subject_id=None):
        if request.method == 'GET':
            subjects = Subject.query.all()
            quiz_counts = (
                db.session.query(Quiz.subject_id, func.count(Quiz.quiz_id).label("cnt"))
                .group_by(Quiz.subject_id)
                .all()
            )
            quiz_map = {sid: cnt for sid, cnt in quiz_counts}
            return jsonify({
                "subjects": [
                    {
                        "subject_id": s.subject_id,
                        "subject_name": s.subject_name,
                        "level": s.level if s.level else None,
                        "quiz_count": quiz_map.get(s.subject_id, 0)
                    }
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

    # CRUD for chapters
    @app.route('/api/chapter', methods=['GET', 'POST'])
    @app.route('/api/chapter/<int:chapter_id>', methods=['GET', 'PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def chapter_api(chapter_id=None):
        if request.method == 'GET':
            if chapter_id:
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

            subject_id = request.args.get("subject_id")
            if not subject_id:
                return jsonify({"error": "subject_id is required"}), 400

            chapters = Chapter.query.filter_by(subject_id=subject_id).all()
            return jsonify({
                "chapters": [
                    {
                        "chapter_id": c.chapter_id,
                        "chapter_name": c.chapter_name,
                        "chapter_description": c.chapter_description
                    } for c in chapters
                ]
            })

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

    # Search endpoint
    @app.route('/api/admin/search', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def admin_search():
        q = request.args.get("q", "")
        search_type = request.args.get("type", "")

        results = {
            "users": [],
            "quizzes": [],
            "subjects": []
        }

        if search_type == "user":
            users = User.query.filter(User.username.contains(q)).all()
            for u in users:
                # Only include completed attempts
                completed_attempts = [
                    {
                        "quiz_title": attempt.quiz.quiz_title,
                        "subject": attempt.quiz.subject.subject_name if attempt.quiz.subject else "N/A",
                        "score": attempt.score,
                        "attempt_date": attempt.attempt_date.strftime('%Y-%m-%d')
                    }
                    for attempt in u.quiz_attempts
                    if attempt.completed_at is not None
                ]

                results["users"].append({
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "qualification": u.qualification,
                    "attempts": completed_attempts
                })

        elif search_type == "quiz":
            quizzes = Quiz.query.filter(Quiz.quiz_title.contains(q)).all()
            for quiz in quizzes:
                results["quizzes"].append({
                    "id": quiz.quiz_id,
                    "title": quiz.quiz_title,
                    "difficulty": quiz.difficulty_level,
                    "total_score": quiz.total_score,
                    "question_count": quiz.questions_count
                })

        elif search_type == "subject":
            subjects = Subject.query.filter(Subject.subject_name.contains(q)).all()
            for subject in subjects:
                results["subjects"].append({
                    "id": subject.subject_id,
                    "name": subject.subject_name,
                    "level": subject.level,
                    "created_at": subject.created_at.isoformat(),
                    "chapters": [ch.chapter_name for ch in subject.chapters],
                    "quiz_count": len(subject.quizzes)
                })

        return jsonify(results)


    
    # List chapters for a subject
    @app.route('/api/subject/<int:subject_id>/chapters', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def list_chapters(subject_id):
        chapters = Chapter.query.filter_by(subject_id=subject_id).all()
        return jsonify({
            "chapters": [
                {
                    "chapter_id": c.chapter_id,
                    "chapter_name": c.chapter_name,
                    "chapter_description": c.chapter_description
                }
                for c in chapters
            ]
        })

    # List quizzes for a subject
    @app.route('/api/subject/<int:subject_id>/quizzes', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def list_quizzes(subject_id):
        quizzes = Quiz.query.filter_by(subject_id=subject_id).all()
        return jsonify({
            "quizzes": [
                {
                    "quiz_id": q.quiz_id,
                    "quiz_title": q.quiz_title,
                    "questions_count": q.questions_count,
                    "questions_added": len(q.questions),
                    "difficulty_level": q.difficulty_level,
                    "total_score": q.total_score,
                    "duration": q.duration,
                    # Defensive: If chapter or questions relationship missing
                    #"max_questions": len(q.chapter.questions) if q.chapter and q.chapter.questions else 0
                } for q in quizzes
            ]
        })
    
    # Quiz CRUD endpoints
    @app.route('/api/quiz', methods=['POST'])
    @app.route('/api/quiz/<int:quiz_id>', methods=['GET', 'PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def quiz_api(quiz_id=None):
        if request.method == 'GET':
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                return jsonify({"error": "Not found"}), 404
            return jsonify({
                "quiz_id": quiz.quiz_id,
                "quiz_title": quiz.quiz_title,
                "chapter_id": quiz.chapter_id,
                "difficulty_level": quiz.difficulty_level,
                "duration": quiz.duration,
                "quiz_date": quiz.quiz_date.strftime("%Y-%m-%dT%H:%M"),
                "questions_count": quiz.questions_count,
                "total_score": quiz.total_score
                
            })

        

        if request.method == 'POST':
            data = request.json or {}

            duration = data.get('duration')
            if not duration or not is_valid_duration(duration):
                return jsonify({"error": "Invalid duration format"}), 400



            chapter = Chapter.query.get(data.get('chapter_id'))
            if not chapter:
                return jsonify({"error": "Invalid chapter ID"}), 400

            new_quiz = Quiz(
                subject_id=data.get('subject_id'),
                chapter_id=data.get('chapter_id'),
                quiz_title=data.get('title'),
                quiz_date=datetime.fromisoformat(data.get('quiz_date')),
                duration=data.get('duration'),
                difficulty_level=data.get('difficulty'),
                questions_count=data.get('questions_count', 0)
            )
            new_quiz.set_total_score()  # Assuming this method exists in your model
            db.session.add(new_quiz)
            db.session.commit()
            return jsonify({"message": "Quiz created", "quiz_id": new_quiz.quiz_id}), 201

        if request.method == 'PUT':
            data = request.json or {}
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                return jsonify({"error": "Quiz not found"}), 404

            quiz.quiz_title = data.get('title', quiz.quiz_title)
            quiz.duration = data.get('duration', quiz.duration)
            quiz.difficulty_level = data.get('difficulty', quiz.difficulty_level)
            quiz.questions_count = data.get('questions_count', quiz.questions_count)
            quiz.set_total_score()
            db.session.commit()
            return jsonify({"message": "Quiz updated"})

        if request.method == 'DELETE':
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                return jsonify({"error": "Quiz not found"}), 404

            db.session.delete(quiz)
            db.session.commit()
            return jsonify({"message": "Quiz deleted"})

    # View quiz questions
    @app.route('/api/quiz/view/<int:quiz_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def view_quiz(quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Not found"}), 404
        return jsonify({
            "quiz_id": quiz.quiz_id,
            "quiz_title": quiz.quiz_title,
            "duration": quiz.duration,
            "difficulty": quiz.difficulty_level,
            "questions_count": quiz.questions_count,
            "total_score": quiz.total_score,
            "chapter_id": quiz.chapter_id,
            "questions": [
                {
                    "id": q.question_id,
                    "text": q.question_text,
                    "options": [q.option1, q.option2, q.option3, q.option4],
                    "correct_answer": q.correct_answer,
                    "marks": q.marks
                } for q in quiz.questions
            ]
        })

    # Question CRUD
    @app.route('/api/chapters', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def get_all_chapters():
        chapters = Chapter.query.all()
        return jsonify({
            "chapters": [
                {
                    "chapter_id": c.chapter_id,
                    "title": c.chapter_name
                } for c in chapters
            ]
        })

    @app.route('/api/question', methods=['POST'])
    @app.route('/api/question/<int:question_id>', methods=['GET', 'PUT', 'DELETE'])
    @auth_required("token")
    @roles_required("admin")
    def question_api(question_id=None):
        if request.method == 'GET':
            question = Questions.query.get(question_id)
            if not question:
                return jsonify({"error": "Not found"}), 404
            return jsonify({
                "question_id": question.question_id,
                "question_text": question.question_text,
                "option1": question.option1,
                "option2": question.option2,
                "option3": question.option3,
                "option4": question.option4,
                "correct_answer": question.correct_answer,
                "marks": question.marks
            })

        

        if request.method == 'POST':
            data = request.json or {}
            new_question = Questions(
                question_text=data.get('question_text'),
                option1=data.get('option1'),
                option2=data.get('option2'),
                option3=data.get('option3'),
                option4=data.get('option4'),
                correct_answer=data.get('correct_answer'),
                marks=data.get('marks'),
                quiz_id=data.get('quiz_id'),
                chapter_id=data.get('chapter_id')
            )
            db.session.add(new_question)
            db.session.commit()
            return jsonify({"message": "Question created", "question_id": new_question.question_id}), 201

        if request.method == 'PUT':
            data = request.json or {}
            question = Questions.query.get(question_id)
            if not question:
                return jsonify({"error": "Not found"}), 404

            question.question_text = data.get('question_text', question.question_text)
            question.option1 = data.get('option1', question.option1)
            question.option2 = data.get('option2', question.option2)
            question.option3 = data.get('option3', question.option3)
            question.option4 = data.get('option4', question.option4)
            question.correct_answer = data.get('correct_answer', question.correct_answer)
            question.marks = data.get('marks', question.marks)
            question.chapter_id = data.get('chapter_id', question.chapter_id)
            db.session.commit()
            return jsonify({"message": "Question updated"})

        if request.method == 'DELETE':
            question = Questions.query.get(question_id)
            if not question:
                return jsonify({"error": "Not found"}), 404
            db.session.delete(question)
            db.session.commit()
            return jsonify({"message": "Question deleted"})
        

#Admin charts

    @app.route('/api/admin/analytics', methods=['GET'])
    @auth_required("token")
    @roles_required("admin")
    def admin_charts():
        # 1 User-wise Top scores by percentage
        users = User.query.all()
        top_scores = []
        for u in users:
            # Calculate best percentage among completed attempts
            completed = [a for a in u.quiz_attempts if a.completed_at is not None]
            if not completed:
                continue
            best = max(completed, key=lambda a: a.score)
            percent = (best.score / best.quiz.total_score) * 100 if best.quiz.total_score else 0
            top_scores.append({
                "username": u.username,
                "percentage": round(percent, 2)
            })
        top_scores.sort(key=lambda x: x["percentage"], reverse=True)

        # 2 Users registered by Level
        level_counts = db.session.query(User.qualification, func.count(User.id)).group_by(User.qualification).all()
        level_data = [{"level": lvl or "Unknown", "count": cnt} for lvl, cnt in level_counts]

        # 3 Subject-wise quiz attempts count
        subj_counts = db.session.query(
            Subject.subject_name,
            func.count(User_Quiz_Attempt.attempt_id)
        ).join(Quiz, Quiz.subject_id == Subject.subject_id
        ).join(User_Quiz_Attempt, User_Quiz_Attempt.quiz_id == Quiz.quiz_id
        ).filter(User_Quiz_Attempt.completed_at.isnot(None)
        ).group_by(Subject.subject_name).all()
        subj_data = [{"subject": name, "attempt_count": cnt} for name, cnt in subj_counts]

        return jsonify({
            "top_scores": top_scores,
            "by_level": level_data,
            "by_subject": subj_data
        })
    

    