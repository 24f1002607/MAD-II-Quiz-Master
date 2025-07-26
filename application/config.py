class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class LocalDevelopmentConfig(Config):
    #configurations of database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///quizwhiz2.db' # DB path file
    DEBUG = True

    #config for flask security
    SECRET_KEY = "aclasssecretkey" #helps to hash user credentials in the session
    SECURITY_PASSWORD_HASH = "bcrypt" #mechanism for hashing password
    SECURITY_PASSWORD_SALT = "aclasssalt" #helps to hash password
    WTF_CSRF_ENABLED = False #related to forms- how will the backend know that the info entered in the application form is correct. It should know that the form is meant for this application and not any random application
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token' 
    SECURITY_TOKEN_AUTHENTICATION_KEY = 'token'
    SECURITY_UNAUTHORIZED_VIEW = None
