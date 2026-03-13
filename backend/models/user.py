from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'patient' or 'staff'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tickets = db.relationship('Ticket', backref='patient', lazy=True, foreign_keys='Ticket.patient_id')
    staff_tickets = db.relationship('Ticket', backref='assigned_staff', lazy=True, foreign_keys='Ticket.assigned_to_id')
    appointments = db.relationship('Appointment', backref='patient', lazy=True, foreign_keys='Appointment.patient_id')
    availabilities = db.relationship('Availability', backref='staff', lazy=True)
    lab_results = db.relationship('LabResult', backref='patient', lazy=True)
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
