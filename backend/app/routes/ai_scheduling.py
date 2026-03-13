from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.appointment import Appointment, Availability
from datetime import datetime, date, time, timedelta
import json
import os

bp = Blueprint('ai_scheduling', __name__)

def parse_with_openai(prompt):
    try:
        import openai
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": """You parse appointment requests into JSON. Respond ONLY with valid JSON, no markdown.
Format: {"after_date": "YYYY-MM-DD", "before_date": "YYYY-MM-DD", "prefer_time_start": "HH:MM", "prefer_time_end": "HH:MM", "duration_minutes": 30}
Use null for unspecified fields. Interpret relative dates from today."""
            }, {
                "role": "user",
                "content": prompt
            }],
            temperature=0
        )
        text = response.choices[0].message.content.strip()
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        return None

def parse_with_gemini(prompt):
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(
            f"""Parse this appointment request into JSON. Reply ONLY with JSON, no markdown.
Format: {{"after_date": "YYYY-MM-DD", "before_date": "YYYY-MM-DD", "prefer_time_start": "HH:MM", "prefer_time_end": "HH:MM", "duration_minutes": 30}}
Use null for unspecified. Today is {date.today().isoformat()}.

Request: {prompt}"""
        )
        text = response.text.strip()
        if '```' in text:
            text = text.split('```')[1].replace('json', '').strip()
        return json.loads(text)
    except Exception:
        return None

def parse_request(prompt):
    if os.getenv('OPENAI_API_KEY'):
        return parse_with_openai(prompt)
    if os.getenv('GEMINI_API_KEY'):
        return parse_with_gemini(prompt)
    return None

def get_slots_for_date(d, availabilities):
    slots = []
    for av in availabilities:
        if av.day_of_week != d.weekday():
            continue
        current = datetime.combine(d, av.start_time)
        end_dt = datetime.combine(d, av.end_time)
        while current + timedelta(minutes=av.slot_duration_minutes) <= end_dt:
            slots.append({
                'date': d.isoformat(),
                'start': current.time().strftime('%H:%M'),
                'end': (current + timedelta(minutes=av.slot_duration_minutes)).time().strftime('%H:%M')
            })
            current += timedelta(minutes=av.slot_duration_minutes)
    return slots

def get_booked_times(d):
    apps = Appointment.query.filter_by(appointment_date=d, status='scheduled').all()
    return [(a.start_time, a.end_time) for a in apps]

def filter_available(slots, booked):
    result = []
    for slot in slots:
        s = datetime.strptime(slot['start'], '%H:%M').time()
        e = datetime.strptime(slot['end'], '%H:%M').time()
        if not any((s < be and e > bs) for bs, be in booked):
            result.append(slot)
    return result

@bp.route('/recommend', methods=['POST'])
@jwt_required()
def recommend_slots():
    if get_jwt().get('role') != 'patient':
        return jsonify({'error': 'Patient only'}), 403
    
    data = request.get_json()
    prompt = data.get('request') or data.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'Natural language request required'}), 400
    
    constraints = parse_request(prompt)
    if not constraints:
        return jsonify({
            'error': 'AI parsing unavailable. Add OPENAI_API_KEY or GEMINI_API_KEY to .env',
            'slots': []
        }), 503
    
    today = date.today()
    after = constraints.get('after_date') or today.isoformat()
    before = constraints.get('before_date') or (today + timedelta(days=14)).isoformat()
    if isinstance(after, str):
        after = datetime.strptime(after, '%Y-%m-%d').date()
    if isinstance(before, str):
        before = datetime.strptime(before, '%Y-%m-%d').date()
    
    prefer_start = constraints.get('prefer_time_start')
    prefer_end = constraints.get('prefer_time_end')
    duration = constraints.get('duration_minutes', 30)
    
    availabilities = Availability.query.all()
    if not availabilities:
        return jsonify({'slots': [], 'constraints': constraints})
    
    all_slots = []
    d = after
    while d <= before:
        day_slots = get_slots_for_date(d, availabilities)
        booked = get_booked_times(d)
        available = filter_available(day_slots, booked)
        all_slots.extend(available)
        d += timedelta(days=1)
    
    # Prefer time window if specified
    if prefer_start or prefer_end:
        def score(slot):
            s = datetime.strptime(slot['start'], '%H:%M').time()
            score_val = 0
            if prefer_start:
                ps = datetime.strptime(prefer_start, '%H:%M').time()
                if s >= ps:
                    score_val += 10
            if prefer_end:
                pe = datetime.strptime(prefer_end, '%H:%M').time()
                if s <= pe:
                    score_val += 10
            return score_val
        all_slots.sort(key=score, reverse=True)
    
    return jsonify({
        'slots': all_slots[:20],
        'constraints': constraints
    })
