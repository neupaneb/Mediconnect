from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from models.ticket import Ticket, TICKET_CATEGORIES
from models.appointment import Appointment
from datetime import datetime, timedelta
import io
import csv

bp = Blueprint('analytics', __name__)

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    
    tickets_by_category = {}
    for c in TICKET_CATEGORIES:
        tickets_by_category[c] = Ticket.query.filter_by(category=c).count()
    
    tickets_by_status = {}
    for s in ['Open', 'In Review', 'Waiting on Patient', 'Resolved', 'Closed']:
        tickets_by_status[s] = Ticket.query.filter_by(status=s).count()
    
    # Resolution time (simplified: resolved tickets)
    resolved = Ticket.query.filter_by(status='Resolved').all()
    resolved.extend(Ticket.query.filter_by(status='Closed').all())
    avg_resolution_hours = None
    if resolved:
        total_hours = 0
        for t in resolved:
            if t.updated_at and t.created_at:
                delta = t.updated_at - t.created_at
                total_hours += delta.total_seconds() / 3600
        avg_resolution_hours = round(total_hours / len(resolved), 2)
    
    # Appointments
    week_ago = datetime.utcnow().date() - timedelta(days=7)
    appointment_volume = Appointment.query.filter(
        Appointment.appointment_date >= week_ago,
        Appointment.status == 'scheduled'
    ).count()
    
    return jsonify({
        'tickets_by_category': tickets_by_category,
        'tickets_by_status': tickets_by_status,
        'avg_resolution_hours': avg_resolution_hours,
        'appointment_volume_7d': appointment_volume,
        'total_tickets': Ticket.query.count(),
        'total_appointments': Appointment.query.filter_by(status='scheduled').count()
    })

@bp.route('/export/tickets', methods=['GET'])
@jwt_required()
def export_tickets():
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    
    tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(['ID', 'Patient', 'Category', 'Subject', 'Status', 'Created', 'Updated'])
    for t in tickets:
        w.writerow([
            t.id,
            f"{t.patient.first_name} {t.patient.last_name}" if t.patient else '',
            t.category,
            t.subject,
            t.status,
            t.created_at.isoformat() if t.created_at else '',
            t.updated_at.isoformat() if t.updated_at else ''
        ])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='tickets.csv'
    )

@bp.route('/export/appointments', methods=['GET'])
@jwt_required()
def export_appointments():
    if get_jwt().get('role') != 'staff':
        return jsonify({'error': 'Staff required'}), 403
    
    appointments = Appointment.query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.start_time.desc()
    ).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(['ID', 'Patient', 'Date', 'Start', 'End', 'Status', 'Notes'])
    for a in appointments:
        w.writerow([
            a.id,
            f"{a.patient.first_name} {a.patient.last_name}" if a.patient else '',
            a.appointment_date.isoformat() if a.appointment_date else '',
            a.start_time.strftime('%H:%M') if a.start_time else '',
            a.end_time.strftime('%H:%M') if a.end_time else '',
            a.status,
            a.notes or ''
        ])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='appointments.csv'
    )
