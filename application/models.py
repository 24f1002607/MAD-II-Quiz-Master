from .database import db #. refers to the current folder
from flask import current_app
from itsdangerous import URLSafeTimedSerializer
from flask_security import UserMixin, RoleMixin
from sqlalchemy import Enum
from datetime import datetime, timezone, timedelta
from sqlalchemy import CheckConstraint, Time
from sqlalchemy.ext.mutable import MutableDict
import re

def is_valid_duration(duration_str):
        # Validates if duration matches HH:MM, where HH=0-99, MM=00-59
        return bool(re.match(r'^\d{1,2}:[0-5]\d$', duration_str))



class User(db.Model, UserMixin):
    __tablename__ = 'user'
    #required for flask security
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    fs_uniquifier = db.Column(db.String, unique=True, nullable=False)
    active = db.Column(db.Boolean, default=True) # Approval status
    qualification = db.Column(Enum("Admin", "Foundation", "Diploma Data Science", "Diploma Programming", "Degree BSc", "Degree BS" )) 
    
    # New fields:
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    reminder_time = db.Column(Time, nullable=True)  # User’s preferred reminder time (e.g. 18:00:00)
    
    #Many to many relationship
    roles = db.relationship('Role', backref = 'users', secondary = 'users_roles')
    #One to many relationship with User_Quiz_Attempt
    quiz_attempts=db.relationship('User_Quiz_Attempt', back_populates='user', lazy=True)

    

class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    #required for flask security
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String)

#many to many
class UsersRoles(db.Model):
    __tablename__ = 'users_roles'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))


#Second entity
class Subject(db.Model):
    __tablename__ = "subject"
    subject_id = db.Column(db.Integer, primary_key=True, autoincrement=True) # Primary Key for Subject table
    subject_name = db.Column(db.String(120), nullable=False) # Subject name
    level = db.Column(Enum("Admin", "Foundation", "Diploma Data Science", "Diploma Programming", "Degree BSc", "Degree BS")) # Subject description
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc)) # Date and time of creation
    # One-to-many relationship with Chapter
    chapters=db.relationship('Chapter', back_populates='subject', lazy=True, cascade="all, delete")
    # One-to-many relationship with Quiz
    quizzes=db.relationship('Quiz', back_populates='subject', lazy=True, cascade="all, delete")

#Third Entity
class Chapter(db.Model):
    __tablename__ = "chapter"
    chapter_id = db.Column(db.Integer, primary_key=True, autoincrement=True) # Primary Key for Chapter table
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.subject_id'), nullable=False) # Subject ID
    chapter_name = db.Column(db.String(120), nullable=False) # Chapter name
    chapter_description = db.Column(db.String(200), nullable=True) # Chapter description
    #questions_count=db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc)) # Date and time of creation
    # One-to-many relationship with Quiz
    quizzes=db.relationship('Quiz', back_populates='chapter', lazy=True, cascade="all, delete")
    #One-to-many relationships with Questions
    questions=db.relationship('Questions', back_populates='chapter', lazy=True, cascade="all, delete")
    subject=db.relationship('Subject', back_populates='chapters')

#Fourth Entity
class Quiz(db.Model):
    __tablename__ = "quiz"
    quiz_id= db.Column(db.Integer, primary_key=True, autoincrement=True) # Primary Key for Quiz table
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.chapter_id'), nullable=False) # Chapter ID
    quiz_title=db.Column(db.String(120), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.subject_id'), nullable=False) # Subject ID
    quiz_date= db.Column(db.DateTime, nullable=False) # Date when the quiz will be created
    questions_count=db.Column(db.Integer, default=0)
    duration=db.Column(db.String(10), nullable=False) # Duration of the quiz (format: (hh:mm)), nullable=False)
    #Enum for difficulty level
    difficulty_level= db.Column(Enum('Easy', 'Medium', 'Hard', name='difficulty_level'), nullable=False)
    #Calculate the maximum score for the quiz based on the difficulty level
    total_score=db.Column(db.Integer, nullable=False)
    #One to many relationship with Questions
    questions=db.relationship('Questions', back_populates='quiz', lazy=True, cascade="all, delete")
    #One to many relationship with User_Quiz_Attempt
    user_quiz_attempts=db.relationship('User_Quiz_Attempt', back_populates='quiz', lazy=True)
    chapter=db.relationship('Chapter', back_populates='quizzes')
    subject=db.relationship('Subject', back_populates='quizzes')

    #newly added
    def get_duration_in_minutes(self):
        """Convert HH:MM format to total minutes"""
        hours, minutes = map(int, self.duration.split(':'))
        return hours * 60 + minutes  # Convert hours to minutes and add the minutes
    

    def set_total_score(self):
        if self.difficulty_level == 'Easy':
            self.total_score = 20
        elif self.difficulty_level == 'Medium':
            self.total_score = 30
        elif self.difficulty_level == 'Hard':
            self.total_score = 50

    def is_expired(self):
    #Return True if the quiz duration has passed since quiz_date.
        if not self.quiz_date or not self.duration:
            return False  # Defensive: no date/duration set

        try:
            # Convert HH:MM to total minutes
            hours, minutes = map(int, self.duration.split(':'))
            duration_delta = timedelta(hours=hours, minutes=minutes)

            # Calculate quiz expiry time
            expiry_time = self.quiz_date + duration_delta
            return datetime.now(timezone.utc) > expiry_time

        except Exception as e:
            print(f"Error checking quiz expiry: {e}")
            return False
        
    def time_left(self):
        #Returns timedelta left before the quiz expires.
        if not self.quiz_date or not self.duration:
            return timedelta(0)
        hours, minutes = map(int, self.duration.split(':'))
        expiry_time = self.quiz_date + timedelta(hours=hours, minutes=minutes)
        return max(timedelta(0), expiry_time - datetime.now(timezone.utc))

#Fifth Entity
class Questions(db.Model):
    __tablename__ = "questions"
    question_id = db.Column(db.Integer, primary_key=True, autoincrement=True) # Primary Key for Question table
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.quiz_id'), nullable=False) # Quiz ID
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.chapter_id'), nullable=False) # Chapter ID
    question_text = db.Column(db.String(200), nullable=False) # Question text
    option1 = db.Column(db.String(200), nullable=False) # Option 1
    option2 = db.Column(db.String(200), nullable=False) # Option 2
    option3 = db.Column(db.String(200), nullable=False) # Option 3
    option4 = db.Column(db.String(200), nullable=False) # Option 4
    correct_answer = db.Column(db.Integer, nullable=False) # Correct answer (1,2,3,4)
    marks=db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc)) # Date and time of creation
    #One to many relationship with Chapter and Quiz
    chapter= db.relationship('Chapter', back_populates='questions')
    quiz=db.relationship('Quiz', back_populates='questions')

    #Add a check constraint to the correct_answer column
    __table_args__=(
    CheckConstraint('correct_answer IN (1, 2, 3, 4)', name='correct_answer_check'),
    )
    

#sixth entity
class User_Quiz_Attempt(db.Model):
    __tablename__ = "user_quiz_attempt"
    attempt_id = db.Column(db.Integer, primary_key=True, autoincrement=True) # Primary Key for User Quiz Attempt table
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # User ID
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.quiz_id'), nullable=False) # Quiz ID
    score=db.Column(db.Integer, nullable=False, default=0)
    is_active=db.Column(db.Boolean, default=True) #Indicates if the attempt is active or "hidden"
    attempt_date=db.Column(db.DateTime, nullable=False)
    
    attempt_time=db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc)) #Timestamp when the quiz attempt started
    completed_at=db.Column(db.DateTime, nullable=True) #Timestamp when the quiz attempt was completed
    
    time_taken= db.Column(db.Integer, nullable=True) #Time taken to complete the quiz in minutes
    exceeded_time = db.Column(db.Boolean, default=False)
    selected_answers =db.Column(MutableDict.as_mutable(db.JSON), nullable=False, default=dict) #Store answers as json

    #Relationships with User and Quiz
    user=db.relationship('User', back_populates='quiz_attempts')
    quiz=db.relationship('Quiz', back_populates='user_quiz_attempts')

    def __repr__(self):
        return f'<User_Quiz_Attempt {self.attempt_id}>'
  

    def calculate_score(self, selected_answers):
        score = 0
        for question in self.quiz.questions:
            if question.correct_answer == selected_answers.get((str(question.question_id))):
                score += question.marks
        return score
                
    def check_time_limit(self):
        """Check if the user has exceeded the quiz's time limit"""
        total_duration_in_mins = self.quiz.get_duration_in_minutes()  # Get quiz duration in total minutes
        
        # Calculate time taken in minutes
        if self.completed_at:
            time_taken_in_mins = (self.completed_at - self.attempt_time).total_seconds() / 60
        else:
            # If the quiz is not completed yet, use the current time
            time_taken_in_mins = (datetime.now() - self.attempt_time).total_seconds() / 60
        
        self.time_taken = time_taken_in_mins  # Store the total time taken by the user

        # If the time taken exceeds the duration, calculate the exceeded time
        if time_taken_in_mins > total_duration_in_mins:
            self.exceeded_time = True  # Store how much time exceeded
            return False  # Indicate that time was exceeded
        
        self.exceeded_time = False
        return True
        




