from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models.user import User

bp = Blueprint('users', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def list_users():
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    role = request.args.get('role')
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(User.last_name, User.first_name).all()
    return jsonify({'users': [u.to_dict() for u in users]})
