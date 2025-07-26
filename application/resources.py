# application/resources.py

def roles_list(roles):
    """
    Utility to convert Role objects list to list of role names.
    """
    return [role.name for role in roles]
