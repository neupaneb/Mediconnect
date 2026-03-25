from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models.user import db, bcrypt
from sqlalchemy import inspect, text


def ensure_schema_updates():
    inspector = inspect(db.engine)

    if inspector.has_table('tickets'):
        ticket_columns = {c['name'] for c in inspector.get_columns('tickets')}
        if 'priority' not in ticket_columns:
            db.session.execute(text("ALTER TABLE tickets ADD COLUMN priority VARCHAR(20) DEFAULT 'routine'"))
        if 'department' not in ticket_columns:
            db.session.execute(text("ALTER TABLE tickets ADD COLUMN department VARCHAR(50) DEFAULT 'Primary Care'"))

    if inspector.has_table('ticket_messages'):
        message_columns = {c['name'] for c in inspector.get_columns('ticket_messages')}
        if 'internal_only' not in message_columns:
            db.session.execute(text("ALTER TABLE ticket_messages ADD COLUMN internal_only BOOLEAN DEFAULT 0"))

    db.session.commit()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)
    bcrypt.init_app(app)
    jwt = JWTManager(app)
    
    # JWT error handlers for better error messages
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired. Please log in again.'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token. Please log in again.'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token is missing.'}), 401
    
    @jwt.token_verification_failed_loader
    def token_verification_failed_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token verification failed.'}), 401
    
    with app.app_context():
        from models import User, Ticket, TicketMessage, Appointment, AppointmentIntake, Availability, LabResult
        db.create_all()
        ensure_schema_updates()
        import os
        upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
    
    from .routes import auth, tickets, appointments, lab_results, users, analytics, availability, ai_scheduling
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(tickets.bp, url_prefix='/api/tickets')
    app.register_blueprint(appointments.bp, url_prefix='/api/appointments')
    app.register_blueprint(lab_results.bp, url_prefix='/api/lab-results')
    app.register_blueprint(analytics.bp, url_prefix='/api/analytics')
    app.register_blueprint(availability.bp, url_prefix='/api/availability')
    app.register_blueprint(ai_scheduling.bp, url_prefix='/api/ai-scheduling')
    
    return app
