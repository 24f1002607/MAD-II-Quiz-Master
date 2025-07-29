from application.tasks import make_celery
from application.models import User, Quiz
from datetime import datetime, timedelta, timezone
import requests

# Import app via create_app() pattern (matches your app.py)
from app import create_app
app = create_app()
celery = make_celery(app)

@celery.task
def send_daily_reminders():
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(days=1)

    users = User.query.all()
    new_quizzes = Quiz.query.filter(Quiz.quiz_date >= one_day_ago).all()

    for user in users:
        # Simplify: always notify (or add your own condition)
        message = f"Hi {user.username}, check out {len(new_quizzes)} new quiz(es) added recently!"
        if user.chat_webhook_url:
            try:
                requests.post(user.chat_webhook_url, json={"text": message})
            except Exception as e:
                print(f"[Reminder] Failed to notify {user.username}: {e}")
