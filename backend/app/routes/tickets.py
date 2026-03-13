from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.user import User, db
from models.ticket import Ticket, TicketMessage, TICKET_CATEGORIES, TICKET_STATUSES

bp = Blueprint('tickets', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def list_tickets():
    user_id = int(get_jwt_identity())
    role = get_jwt().get('role')
    
    if role == 'patient':
        tickets = Ticket.query.filter_by(patient_id=user_id).order_by(Ticket.updated_at.desc()).all()
    else:
        status = request.args.get('status')
        category = request.args.get('category')
        query = Ticket.query
        if status:
            query = query.filter_by(status=status)
        if category:
            query = query.filter_by(category=category)
        tickets = query.order_by(Ticket.updated_at.desc()).all()
    
    return jsonify([t.to_dict() for t in tickets])

@bp.route('', methods=['POST'])
@jwt_required()
def create_ticket():
    try:
        user_id = int(get_jwt_identity())
        role = get_jwt().get('role')
        if role != 'patient':
            return jsonify({'error': 'Only patients can create tickets'}), 403
        
        data = request.get_json()
        if not data or not data.get('subject'):
            return jsonify({'error': 'Subject required'}), 400
        
        category = data.get('category', 'general_inquiry')
        if category not in TICKET_CATEGORIES:
            category = 'general_inquiry'
        
        ticket = Ticket(
            patient_id=user_id,
            category=category,
            subject=data['subject'],
            lab_result_id=data.get('lab_result_id')
        )
        db.session.add(ticket)
        db.session.commit()
        
        if data.get('content'):
            msg = TicketMessage(ticket_id=ticket.id, user_id=user_id, content=data['content'])
            db.session.add(msg)
            db.session.commit()
        
        return jsonify(ticket.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    user_id = int(get_jwt_identity())
    role = get_jwt().get('role')
    
    if role == 'patient' and ticket.patient_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    result = ticket.to_dict()
    result['messages'] = [m.to_dict() for m in ticket.messages]
    return jsonify(result)

@bp.route('/<int:ticket_id>', methods=['PATCH'])
@jwt_required()
def update_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    user_id = int(get_jwt_identity())
    role = get_jwt().get('role')
    
    if role == 'staff':
        data = request.get_json()
        if data.get('status') and data['status'] in TICKET_STATUSES:
            ticket.status = data['status']
        if data.get('assigned_to_id') is not None:
            ticket.assigned_to_id = data['assigned_to_id']
        db.session.commit()
    elif role == 'patient' and ticket.patient_id == user_id:
        data = request.get_json()
        if data.get('status') == 'Waiting on Patient':
            ticket.status = 'Waiting on Patient'
        db.session.commit()
    else:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(ticket.to_dict())

@bp.route('/<int:ticket_id>/messages', methods=['POST'])
@jwt_required()
def add_message(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    user_id = int(get_jwt_identity())
    role = get_jwt().get('role')
    
    if role == 'patient' and ticket.patient_id != user_id:
        return jsonify({'error': 'Access denied'}), 403
    if role == 'staff' and ticket.assigned_to_id and ticket.assigned_to_id != user_id:
        if ticket.assigned_to_id != user_id:
            ticket.assigned_to_id = user_id
    
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'error': 'Content required'}), 400
    
    msg = TicketMessage(ticket_id=ticket_id, user_id=user_id, content=data['content'])
    db.session.add(msg)
    if ticket.status == 'Resolved' or ticket.status == 'Closed':
        ticket.status = 'In Review'
    db.session.commit()
    
    return jsonify(msg.to_dict()), 201

@bp.route('/categories', methods=['GET'])
def categories():
    return jsonify(TICKET_CATEGORIES)

@bp.route('/statuses', methods=['GET'])
def statuses():
    return jsonify(TICKET_STATUSES)
