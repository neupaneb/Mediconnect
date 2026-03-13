from .user import db
from datetime import datetime

TICKET_CATEGORIES = ['appointment_request', 'billing_issue', 'prescription_request', 'general_inquiry']
TICKET_STATUSES = ['Open', 'In Review', 'Waiting on Patient', 'Resolved', 'Closed']

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    category = db.Column(db.String(50), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(30), default='Open')
    lab_result_id = db.Column(db.Integer, db.ForeignKey('lab_results.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    messages = db.relationship('TicketMessage', backref='ticket', lazy=True, order_by='TicketMessage.created_at')
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': f"{self.patient.first_name} {self.patient.last_name}" if self.patient else None,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_name': f"{self.assigned_staff.first_name} {self.assigned_staff.last_name}" if self.assigned_staff else None,
            'category': self.category,
            'subject': self.subject,
            'status': self.status,
            'lab_result_id': self.lab_result_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'message_count': len(self.messages)
        }


class TicketMessage(db.Model):
    __tablename__ = 'ticket_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    attachment_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='ticket_messages')
    
    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'user_name': f"{self.user.first_name} {self.user.last_name}" if self.user else None,
            'content': self.content,
            'attachment_path': self.attachment_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
