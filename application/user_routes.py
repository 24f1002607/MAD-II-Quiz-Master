from flask import jsonify, request
from flask_security import auth_required, roles_required, current_user
from application.models import *
from application.database import db
from datetime import datetime, timezone

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
    @app.route('/api/user/quiz/view/<int:quiz_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def view_quiz_details(quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        subject = Subject.query.get(quiz.subject_id)
        chapter = Chapter.query.get(quiz.chapter_id)
        questions = Questions.query.filter_by(quiz_id=quiz_id).all()

        return jsonify({
            "quiz": {
                "quiz_id": quiz.quiz_id,
                "quiz_title": quiz.quiz_title,
                "questions_count": quiz.questions_count,
                "difficulty": quiz.difficulty_level,
                "duration": quiz.duration,
                "total_score": quiz.total_score,
                "quiz_date": quiz.quiz_date.isoformat() if quiz.quiz_date else None,
                "subject": subject.subject_name if subject else "Unknown",
                "chapter": chapter.chapter_name if chapter else "Unknown"
            },
            "questions": [
                {
                    "question_id": q.question_id,  # 
                    "question_text": q.question_text,
                    "option1": q.option1,
                    "option2": q.option2,
                    "option3": q.option3,
                    "option4": q.option4,
                    "marks": q.marks
                }
                for q in questions
            ]
        })

    
    
    @app.route('/api/quiz/start/<int:quiz_id>', methods=['POST'])
    @auth_required("token")
    @roles_required("user")
    def start_quiz(quiz_id):
        attempt = User_Quiz_Attempt(
            user_id=current_user.id,
            score = 0,
            is_active = True,
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
    
    @app.route('/api/quiz/full/<int:quiz_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def get_full_quiz(quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz not found"}), 404

        questions = [{
            "question_id": q.question_id,
            "question_text": q.question_text,
            "options": [{"option_id": o.option_id, "option_text": o.option_text} for o in q.options]
        } for q in quiz.questions]

        return jsonify({
            "quiz_id": quiz.quiz_id,
            "quiz_title": quiz.quiz_title,
            "duration": quiz.duration,
            "difficulty": quiz.difficulty_level,
            "questions": questions
        })

    
    #Submit quiz
    @app.route('/api/quiz/submit/<int:attempt_id>', methods=['POST'])
    @auth_required("token")
    @roles_required("user")
    def submit_quiz(attempt_id):
        data = request.get_json()
        answers = data.get('answers', {})

        attempt = User_Quiz_Attempt.query.get(attempt_id)
        if not attempt or attempt.user_id != current_user.id:
            return jsonify({"error": "Not authorized"}), 403

        # Ensure aware datetime
        if attempt.attempt_time.tzinfo is None:
            attempt.attempt_time = attempt.attempt_time.replace(tzinfo=timezone.utc)

        attempt.completed_at = datetime.now(timezone.utc)
        attempt.check_time_limit()

        # Calculate score, store answers
        total_score = 0
        quiz = Quiz.query.get(attempt.quiz_id)
        for question in quiz.questions:
            qid_str = str(question.question_id)
            selected = answers.get(qid_str)
            if selected is not None:
                if int(selected) == question.correct_answer:
                    total_score += question.marks

        attempt.score = total_score
        attempt.selected_answers = answers
        db.session.commit()

        return jsonify({"message": "Submitted successfully", "score": total_score})






    @app.route('/api/quiz/results/<int:attempt_id>', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def get_quiz_result(attempt_id):
        attempt = User_Quiz_Attempt.query.get(attempt_id)
        if not attempt or attempt.user_id != current_user.id:
            return jsonify({"error": "Not allowed"}), 403

        quiz = attempt.quiz
        results = []
        for q in quiz.questions:
            user_answer = attempt.selected_answers.get(str(q.question_id))
            correct = q.correct_answer
            marks = q.marks if user_answer == correct else 0
            results.append({
                "question_text": q.question_text,
                "your_answer": user_answer,
                "correct_answer": correct,
                "marks_awarded": marks,
                "options": {
                    "1": q.option1,
                    "2": q.option2,
                    "3": q.option3,
                    "4": q.option4
                }  
            })

        return jsonify({
            "quiz_title": quiz.quiz_title,
            "subject": quiz.subject.subject_name,
            "username": current_user.username,
            "score": attempt.score,
            "total_score": quiz.total_score,
            "time_taken": attempt.time_taken,
            "details": results
        })

    
    @app.route('/api/quiz/results/history', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def history_quiz_results():
        attempts = User_Quiz_Attempt.query.filter(
            User_Quiz_Attempt.user_id == current_user.id,
            User_Quiz_Attempt.completed_at.isnot(None)
        ).all()

        history = []
        for a in attempts:
            exceeded = False
            if a.quiz.get_duration_in_minutes() is not None:
                exceeded = (a.time_taken or 0) > a.quiz.get_duration_in_minutes()
            history.append({
                "subject": a.quiz.subject.subject_name,
                "quiz_id": a.quiz_id,
                "attempt_id": a.attempt_id,
                "date_taken": a.attempt_date.isoformat() if a.attempt_date else None,
                "difficulty": a.quiz.difficulty_level,
                "duration": a.quiz.duration,
                "time_taken": round(a.time_taken,2) if a.time_taken else None,
                "exceeded": exceeded,
                "score": a.score,
                "total_score": a.quiz.total_score
            })
        return jsonify(history)

# User graphs
    @app.route('/api/user/subject_scores', methods=['GET'])
    @auth_required("token")
    @roles_required("user")
    def subject_scores():
        user_id = current_user.id
        attempts = User_Quiz_Attempt.query.filter_by(user_id=user_id).all()

        subject_data = {}

        for attempt in attempts:
            if not attempt.completed_at:
                continue
            subject_name = attempt.quiz.subject.subject_name
            if subject_name not in subject_data:
                subject_data[subject_name] = {
                    "total_score": 0,
                    "count": 0
                }
            subject_data[subject_name]["total_score"] += attempt.score
            subject_data[subject_name]["count"] += 1

        result = []
        for subject, data in subject_data.items():
            avg = data["total_score"] / data["count"]
            result.append({
                "subject": subject,
                "average_score": round(avg, 2),
                "attempts": data["count"]   # Add attempts count here
            })

        return jsonify(result)
    

    @app.route('/api/user/reminder_time', methods=['GET', 'POST'])
    @auth_required("token")
    def reminder_time():
        if request.method == 'GET':
            rt = current_user.reminder_time.isoformat() if current_user.reminder_time else None
            return jsonify({"reminder_time": rt}), 200

        if request.method == 'POST':
            data = request.get_json()
            reminder_str = data.get('reminder_time')
            if not reminder_str:
                return jsonify({"message": "reminder_time is required"}), 400

            # parse datetime string here, e.g. ISO 8601
            from dateutil.parser import parse
            try:
                reminder_dt = parse(reminder_str).time() #extract the time only
            except Exception:
                return jsonify({"message": "Invalid datetime format"}), 400

            current_user.reminder_time = reminder_dt
            db.session.commit()
            return jsonify({"message": "Reminder time updated", "reminder_time": reminder_dt.isoformat()}), 200








