from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models.user import db
from models.appointment import Availability
from datetime import time

bp = Blueprint('availability', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def list_availability():
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    avail = Availability.query.all()
    return jsonify([a.to_dict() for a in avail])

@bp.route('', methods=['POST'])
@jwt_required()
def create_availability():
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    data = request.get_json()
    staff_id = get_jwt().get('sub') or request.json.get('staff_id')
    if not staff_id:
        staff_id = get_jwt().get('sub')
    # For now use current user
    from flask_jwt_extended import get_jwt_identity
    staff_id = int(get_jwt_identity())
    
    def parse_time(s):
        if isinstance(s, str):
            h, m = map(int, s.split(':'))
            return time(h, m)
        return s
    
    av = Availability(
        staff_id=staff_id,
        day_of_week=data['day_of_week'],
        start_time=parse_time(data['start_time']),
        end_time=parse_time(data['end_time']),
        slot_duration_minutes=data.get('slot_duration_minutes', 30)
    )
    db.session.add(av)
    db.session.commit()
    return jsonify(av.to_dict()), 201

@bp.route('/<int:aid>', methods=['DELETE'])
@jwt_required()
def delete_availability(aid):
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    av = Availability.query.get_or_404(aid)
    db.session.delete(av)
    db.session.commit()
    return '', 204
