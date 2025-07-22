from flask import request, jsonify
from flask_restful import Api, Resource
from flask_security import auth_required, roles_required, current_user, logout_user
from app import db
from models import User, Subject, Chapter, Quiz, Questions, User_Quiz_Attempt
from datetime import datetime

def roles_list(roles):
    return [role.name for role in roles]

api = Api()  # ensure this is registered with your Flask app

# --- Admin & User Dashboards ---
class AdminDashboard(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        users = User.query.all()
        subjects = Subject.query.all()
        quizzes = Quiz.query.all()
        return {
            "users": [{"id": u.id, "username": u.username, "email": u.email, "active": u.active} for u in users],
            "subjects": [{"id": s.subject_id, "name": s.subject_name, "level": s.level} for s in subjects],
            "quizzes": [{"id": q.quiz_id, "title": q.quiz_title} for q in quizzes]
        }

class UserDashboard(Resource):
    @auth_required("token")
    @roles_required("user")
    def get(self):
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "qualification": current_user.qualification
        }

# --- Auth Routes ---
class AdminLogout(Resource):
    @auth_required("token")
    def post(self):
        logout_user()
        return {"message": "Logged out successfully."}

# --- User Management ---
class BlockUser(Resource):
    @auth_required("token")
    @roles_required("admin")
    def post(self, user_id):
        user = User.query.get(user_id)
        if user:
            user.active = False
            db.session.commit()
            return {"message": "User blocked"}
        return {"message": "User not found"}, 404

class UnblockUser(Resource):
    @auth_required("token")
    @roles_required("admin")
    def post(self, user_id):
        user = User.query.get(user_id)
        if user:
            user.active = True
            db.session.commit()
            return {"message": "User unblocked"}
        return {"message": "User not found"}, 404

# --- Subject CRUD ---
class SubjectAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def post(self):
        data = request.json
        new_subject = Subject(subject_name=data['name'], level=data['level'])
        db.session.add(new_subject)
        db.session.commit()
        return {"message": "Subject created"}

    @auth_required("token")
    @roles_required("admin")
    def put(self, subject_id):
        subject = Subject.query.get(subject_id)
        if subject:
            data = request.json
            subject.subject_name = data.get("name", subject.subject_name)
            subject.level = data.get("level", subject.level)
            db.session.commit()
            return {"message": "Subject updated"}
        return {"message": "Subject not found"}, 404

    @auth_required("token")
    @roles_required("admin")
    def delete(self, subject_id):
        subject = Subject.query.get(subject_id)
        if subject:
            db.session.delete(subject)
            db.session.commit()
            return {"message": "Subject deleted"}
        return {"message": "Subject not found"}, 404

# --- Chapter CRUD ---
class ChapterAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def post(self):
        data = request.json
        new_chapter = Chapter(
            subject_id=data['subject_id'],
            chapter_name=data['chapter_name'],
            chapter_description=data.get('description', '')
        )
        db.session.add(new_chapter)
        db.session.commit()
        return {"message": "Chapter created"}

    @auth_required("token")
    @roles_required("admin")
    def put(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if chapter:
            data = request.json
            chapter.chapter_name = data.get("chapter_name", chapter.chapter_name)
            chapter.chapter_description = data.get("description", chapter.chapter_description)
            db.session.commit()
            return {"message": "Chapter updated"}
        return {"message": "Chapter not found"}, 404

    @auth_required("token")
    @roles_required("admin")
    def delete(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if chapter:
            db.session.delete(chapter)
            db.session.commit()
            return {"message": "Chapter deleted"}
        return {"message": "Chapter not found"}, 404

# --- Quiz CRUD ---
class QuizAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def post(self):
        data = request.json
        new_quiz = Quiz(
            chapter_id=data['chapter_id'],
            chapter_name=data['chapter_name'],
            subject_id=data['subject_id'],
            quiz_title=data['title'],
            quiz_date=datetime.strptime(data['quiz_date'], "%Y-%m-%d"),
            questions_count=data['questions_count'],
            duration=data['duration'],
            difficulty_level=data['difficulty'],
            total_score=0  # Set after calling set_total_score
        )
        new_quiz.set_total_score()
        db.session.add(new_quiz)
        db.session.commit()
        return {"message": "Quiz created"}

    @auth_required("token")
    @roles_required("admin")
    def put(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if quiz:
            data = request.json
            quiz.quiz_title = data.get("title", quiz.quiz_title)
            quiz.difficulty_level = data.get("difficulty", quiz.difficulty_level)
            quiz.set_total_score()
            db.session.commit()
            return {"message": "Quiz updated"}
        return {"message": "Quiz not found"}, 404

    @auth_required("token")
    @roles_required("admin")
    def delete(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if quiz:
            db.session.delete(quiz)
            db.session.commit()
            return {"message": "Quiz deleted"}
        return {"message": "Quiz not found"}, 404

# --- View/Edit Quiz (Admin) ---
class ViewEditQuiz(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404
        return {
            "title": quiz.quiz_title,
            "duration": quiz.duration,
            "difficulty": quiz.difficulty_level,
            "questions": [{"id": q.question_id, "text": q.question_text} for q in quiz.questions]
        }

# --- Question CRUD ---
class QuestionAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def post(self):
        data = request.json
        new_q = Questions(**data)
        db.session.add(new_q)
        db.session.commit()
        return {"message": "Question created"}

    @auth_required("token")
    @roles_required("admin")
    def put(self, question_id):
        q = Questions.query.get(question_id)
        if not q:
            return {"message": "Question not found"}, 404
        for key, val in request.json.items():
            setattr(q, key, val)
        db.session.commit()
        return {"message": "Question updated"}

    @auth_required("token")
    @roles_required("admin")
    def delete(self, question_id):
        q = Questions.query.get(question_id)
        if q:
            db.session.delete(q)
            db.session.commit()
            return {"message": "Question deleted"}
        return {"message": "Question not found"}, 404

# --- Quiz Start/Submit/View Results ---
class StartQuiz(Resource):
    @auth_required("token")
    @roles_required("user")
    def post(self, quiz_id):
        attempt = User_Quiz_Attempt(user_id=current_user.id, quiz_id=quiz_id,
                                    attempt_date=datetime.utcnow(), selected_answers={})
        db.session.add(attempt)
        db.session.commit()
        return {"message": "Quiz started", "attempt_id": attempt.attempt_id}

class SubmitQuiz(Resource):
    @auth_required("token")
    @roles_required("user")
    def post(self, attempt_id):
        data = request.json
        attempt = User_Quiz_Attempt.query.get(attempt_id)
        if attempt.user_id != current_user.id:
            return {"message": "Not allowed"}, 403
        attempt.completed_at = datetime.utcnow()
        attempt.selected_answers = data["answers"]
        attempt.score = attempt.calculate_score(data["answers"])
        db.session.commit()
        return {"message": "Quiz submitted", "score": attempt.score}

class ViewResults(Resource):
    @auth_required("token")
    @roles_required("user")
    def get(self):
        attempts = User_Quiz_Attempt.query.filter_by(user_id=current_user.id).all()
        return [{
            "quiz_id": a.quiz_id,
            "score": a.score,
            "attempt_date": a.attempt_date.isoformat()
        } for a in attempts]

# --- Admin Search ---
class AdminSearch(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        q = request.args.get("q", "")
        users = User.query.filter(User.username.contains(q)).all()
        subjects = Subject.query.filter(Subject.subject_name.contains(q)).all()
        quizzes = Quiz.query.filter(Quiz.quiz_title.contains(q)).all()
        return {
            "users": [{"id": u.id, "username": u.username} for u in users],
            "subjects": [{"id": s.subject_id, "name": s.subject_name} for s in subjects],
            "quizzes": [{"id": q.quiz_id, "title": q.quiz_title} for q in quizzes]
        }

api.add_resource(AdminDashboard, '/api/admin-dashboard')
api.add_resource(UserDashboard, '/api/user-dashboard')
api.add_resource(AdminLogout, '/api/logout')
api.add_resource(BlockUser, '/api/user/block/<int:user_id>')
api.add_resource(UnblockUser, '/api/user/unblock/<int:user_id>')
api.add_resource(SubjectAPI, '/api/subject', '/api/subject/<int:subject_id>')
api.add_resource(ChapterAPI, '/api/chapter', '/api/chapter/<int:chapter_id>')
api.add_resource(QuizAPI, '/api/quiz', '/api/quiz/<int:quiz_id>')
api.add_resource(ViewEditQuiz, '/api/quiz/view/<int:quiz_id>')
api.add_resource(QuestionAPI, '/api/question', '/api/question/<int:question_id>')
api.add_resource(StartQuiz, '/api/quiz/start/<int:quiz_id>')
api.add_resource(SubmitQuiz, '/api/quiz/submit/<int:attempt_id>')
api.add_resource(ViewResults, '/api/quiz/results')
api.add_resource(AdminSearch, '/api/admin/search')
