"""Seed test data: patient@test.com and staff@test.com with password 'password123'"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from models.user import User, db
from models.appointment import Availability
from datetime import time

app = create_app()
with app.app_context():
    if User.query.filter_by(email='patient@test.com').first():
        print('Seed data already exists. Skipping.')
        sys.exit(0)
    
    patient = User(
        email='patient@test.com',
        first_name='Test',
        last_name='Patient',
        role='patient'
    )
    patient.set_password('password123')
    
    staff = User(
        email='staff@test.com',
        first_name='Test',
        last_name='Staff',
        role='staff'
    )
    staff.set_password('password123')
    
    db.session.add(patient)
    db.session.add(staff)
    db.session.commit()
    
    # Add sample availability for staff (Mon-Fri 9am-5pm)
    for day in range(5):
        av = Availability(
            staff_id=staff.id,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(17, 0),
            slot_duration_minutes=30
        )
        db.session.add(av)
    db.session.commit()
    
    print('Seed complete!')
    print('  patient@test.com / password123')
    print('  staff@test.com / password123')
