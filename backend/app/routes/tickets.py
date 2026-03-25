from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.user import User, db
from models.ticket import Ticket, TicketMessage, TICKET_CATEGORIES, TICKET_STATUSES, TICKET_DEPARTMENTS, TICKET_PRIORITIES

bp = Blueprint('tickets', __name__)


def default_department_for_category(category):
    mapping = {
        'appointment_request': 'Scheduling',
        'billing_issue': 'Billing',
        'prescription_request': 'Pharmacy',
        'general_inquiry': 'Primary Care',
    }
    return mapping.get(category, 'Primary Care')


def default_priority_for_category(category):
    mapping = {
        'appointment_request': 'routine',
        'billing_issue': 'priority',
        'prescription_request': 'priority',
        'general_inquiry': 'routine',
    }
    return mapping.get(category, 'routine')

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
        department = request.args.get('department')
        priority = request.args.get('priority')
        query = Ticket.query
        if status:
            query = query.filter_by(status=status)
        if category:
            query = query.filter_by(category=category)
        if department:
            query = query.filter_by(department=department)
        if priority:
            query = query.filter_by(priority=priority)
        tickets = query.order_by(
            db.case(
                (Ticket.priority == 'urgent', 0),
                (Ticket.priority == 'priority', 1),
                else_=2
            ),
            Ticket.updated_at.asc()
        ).all()
    
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
        department = data.get('department') if data.get('department') in TICKET_DEPARTMENTS else default_department_for_category(category)
        priority = data.get('priority') if data.get('priority') in TICKET_PRIORITIES else default_priority_for_category(category)
        
        ticket = Ticket(
            patient_id=user_id,
            category=category,
            subject=data['subject'],
            department=department,
            priority=priority,
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
    messages = ticket.messages
    if role == 'patient':
        messages = [m for m in messages if not m.internal_only]
    result['messages'] = [m.to_dict() for m in messages]
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
        if data.get('department') and data['department'] in TICKET_DEPARTMENTS:
            ticket.department = data['department']
        if data.get('priority') and data['priority'] in TICKET_PRIORITIES:
            ticket.priority = data['priority']
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
    
    internal_only = bool(data.get('internal_only')) if role == 'staff' else False
    msg = TicketMessage(ticket_id=ticket_id, user_id=user_id, content=data['content'], internal_only=internal_only)
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


@bp.route('/departments', methods=['GET'])
def departments():
    return jsonify(TICKET_DEPARTMENTS)


@bp.route('/priorities', methods=['GET'])
def priorities():
    return jsonify(TICKET_PRIORITIES)
