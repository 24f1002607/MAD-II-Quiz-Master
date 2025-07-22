from flask_restful import Api, Resource, reqparse
from .models import *
from flask_security import auth_required, roles_required, current_user

api = Api()

def roles_list(roles):
    roles_list = []
    for role in roles:
        roles_list.append(role.name)
    return roles_list

class AdminApi(Resource):
    @auth_required("token", "session")
    @roles_required("admin")
    def get(self):
        users = User.query.all()
        subjects = Subject.query.all()
        users_list = []
        subjects_list = []
        for user in users:
            users_list.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "active": user.active,
                "roles": roles_list(user.roles)
            })
        for subject in subjects:
            subjects_list.append({
                "id": subject.subject_id,
                "name": subject.subject_name,
                "level": subject.level.name
            })
        return {
            "users": users_list,
            "subjects": subjects_list
        }
       


