from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.user import db
from models.appointment import Appointment, Availability
from datetime import datetime, date, time, timedelta

bp = Blueprint('appointments', __name__)

def get_slots_for_date(d, availabilities):
    slots = []
    for av in availabilities:
        if av.day_of_week != d.weekday():
            continue
        current = datetime.combine(d, av.start_time)
        end_dt = datetime.combine(d, av.end_time)
        while current + timedelta(minutes=av.slot_duration_minutes) <= end_dt:
            slots.append({
                'start': current.time().strftime('%H:%M'),
                'end': (current + timedelta(minutes=av.slot_duration_minutes)).time().strftime('%H:%M')
            })
            current += timedelta(minutes=av.slot_duration_minutes)
    return slots

def get_booked_slots(d):
    appointments = Appointment.query.filter_by(
        appointment_date=d, status='scheduled'
    ).all()
    return [(a.start_time, a.end_time) for a in appointments]

def filter_available(slots, booked):
    result = []
    for slot in slots:
        s = datetime.strptime(slot['start'], '%H:%M').time()
        e = datetime.strptime(slot['end'], '%H:%M').time()
        conflict = any(
            (s < be and e > bs) for bs, be in booked
        )
        if not conflict:
            result.append(slot)
    return result

@bp.route('', methods=['GET'])
@jwt_required()
def list_appointments():
    try:
        role = get_jwt().get('role')
        user_id = int(get_jwt_identity())
        
        if role == 'patient':
            appointments = Appointment.query.filter_by(patient_id=user_id).order_by(
                Appointment.appointment_date.desc(), Appointment.start_time.desc()
            ).all()
        else:
            appointments = Appointment.query.order_by(
                Appointment.appointment_date.desc(), Appointment.start_time.desc()
            ).all()
        
        return jsonify([a.to_dict() for a in appointments])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/slots', methods=['GET'])
@jwt_required()
def get_available_slots():
    try:
        start_str = request.args.get('start_date')
        end_str = request.args.get('end_date')
        if not start_str:
            return jsonify({'error': 'start_date required'}), 400
        
        start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_str, '%Y-%m-%d').date() if end_str else start_date + timedelta(days=14)
        
        availabilities = Availability.query.all()
        if not availabilities:
            return jsonify({'slots': {}, 'message': 'No availability slots configured by staff'})
        
        result = {}
        d = start_date
        while d <= end_date:
            day_slots = get_slots_for_date(d, availabilities)
            booked = get_booked_slots(d)
            available = filter_available(day_slots, booked)
            if available:
                result[d.isoformat()] = available
            d += timedelta(days=1)
        
        return jsonify({'slots': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())
        role = get_jwt().get('role')
        
        if role != 'patient':
            return jsonify({'error': 'Only patients can book appointments'}), 403
        
        if not data or not data.get('appointment_date') or not data.get('start_time'):
            return jsonify({'error': 'appointment_date and start_time required'}), 400
        
        appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        duration = data.get('duration_minutes', 30)
        end_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=duration)).time()
        
        conflicts = Appointment.query.filter_by(
            appointment_date=appointment_date, status='scheduled'
        ).filter(
            Appointment.start_time < end_time,
            Appointment.end_time > start_time
        ).first()
        if conflicts:
            return jsonify({'error': 'Time slot already booked'}), 409
        
        appointment = Appointment(
            patient_id=user_id,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            notes=data.get('notes'),
            ticket_id=data.get('ticket_id')
        )
        db.session.add(appointment)
        db.session.commit()
        return jsonify(appointment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:aid>', methods=['PATCH'])
@jwt_required()
def update_appointment(aid):
    try:
        appointment = Appointment.query.get_or_404(aid)
        user_id = int(get_jwt_identity())
        role = get_jwt().get('role')
        
        if role == 'patient' and appointment.patient_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if data.get('status') in ('cancelled', 'completed'):
            appointment.status = data['status']
        
        if data.get('appointment_date') and data.get('start_time') and role == 'patient':
            new_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
            new_start = datetime.strptime(data['start_time'], '%H:%M').time()
            duration = (datetime.combine(date.today(), appointment.end_time) - 
                        datetime.combine(date.today(), appointment.start_time)).seconds // 60
            new_end = (datetime.combine(date.today(), new_start) + timedelta(minutes=duration)).time()
            
            conflicts = Appointment.query.filter_by(appointment_date=new_date, status='scheduled'
            ).filter(Appointment.id != aid).filter(
                Appointment.start_time < new_end, Appointment.end_time > new_start
            ).first()
            if conflicts:
                return jsonify({'error': 'Time slot already booked'}), 409
            
            appointment.appointment_date = new_date
            appointment.start_time = new_start
            appointment.end_time = new_end
        
        db.session.commit()
        return jsonify(appointment.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:aid>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(aid):
    try:
        appointment = Appointment.query.get_or_404(aid)
        user_id = int(get_jwt_identity())
        if appointment.patient_id != user_id and get_jwt().get('role') != 'staff':
            return jsonify({'error': 'Access denied'}), 403
        appointment.status = 'cancelled'
        db.session.commit()
        return jsonify(appointment.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
