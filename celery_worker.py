from application.tasks import make_celery
from app import create_app

flask_app = create_app()
celery = make_celery(flask_app)

#Import your tasks here so they get registered
import application.tasks.reminder

if __name__ == '__main__':
    celery.start()
