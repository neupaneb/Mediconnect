from .user import db
from datetime import datetime

class LabResult(db.Model):
    __tablename__ = 'lab_results'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    test_type = db.Column(db.String(100), nullable=False)
    result_value = db.Column(db.Text, nullable=True)
    unit = db.Column(db.String(50), nullable=True)
    reference_range = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    performed_at = db.Column(db.Date, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    file_path = db.Column(db.String(255), nullable=True)
    
    tickets = db.relationship('Ticket', backref='lab_result', lazy=True, foreign_keys='Ticket.lab_result_id')
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'test_type': self.test_type,
            'result_value': self.result_value,
            'unit': self.unit,
            'reference_range': self.reference_range,
            'notes': self.notes,
            'performed_at': self.performed_at.isoformat() if self.performed_at else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'file_path': self.file_path
        }
