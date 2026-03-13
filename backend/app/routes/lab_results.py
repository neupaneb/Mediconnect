from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.user import User, db
from models.lab_result import LabResult
from datetime import datetime

bp = Blueprint('lab_results', __name__)

@bp.route('', methods=['GET'])
@jwt_required()
def list_lab_results():
    try:
        user_id = int(get_jwt_identity())
        role = get_jwt().get('role')
        
        if role == 'patient':
            results = LabResult.query.filter_by(patient_id=user_id).order_by(
                LabResult.performed_at.desc()
            ).all()
        else:
            patient_id = request.args.get('patient_id')
            if patient_id:
                results = LabResult.query.filter_by(patient_id=patient_id).order_by(
                    LabResult.performed_at.desc()
                ).all()
            else:
                results = LabResult.query.order_by(LabResult.performed_at.desc()).all()
        
        return jsonify([r.to_dict() for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
@jwt_required()
def create_lab_result():
    try:
        if get_jwt().get('role') != 'staff':
            return jsonify({'error': 'Staff required'}), 403
        
        data = request.get_json()
        if not data or not data.get('patient_id') or not data.get('test_type'):
            return jsonify({'error': 'patient_id and test_type required'}), 400
        
        performed = data.get('performed_at', datetime.utcnow().strftime('%Y-%m-%d'))
        if isinstance(performed, str):
            performed = datetime.strptime(performed, '%Y-%m-%d').date()
        
        lab = LabResult(
            patient_id=data['patient_id'],
            test_type=data['test_type'],
            result_value=data.get('result_value'),
            unit=data.get('unit'),
            reference_range=data.get('reference_range'),
            notes=data.get('notes'),
            performed_at=performed
        )
        db.session.add(lab)
        db.session.commit()
        return jsonify(lab.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:rid>', methods=['GET'])
@jwt_required()
def get_lab_result(rid):
    try:
        lab = LabResult.query.get_or_404(rid)
        user_id = int(get_jwt_identity())
        role = get_jwt().get('role')
        
        if role == 'patient' and lab.patient_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify(lab.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
