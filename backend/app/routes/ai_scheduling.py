from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.appointment import Appointment, Availability
from datetime import datetime, date, time, timedelta
import json
import os
import re

bp = Blueprint('ai_scheduling', __name__)

JSON_PARSE_PROMPT = """You parse appointment requests into JSON. Respond ONLY with valid JSON, no markdown.
Format: {"after_date": "YYYY-MM-DD", "before_date": "YYYY-MM-DD", "prefer_time_start": "HH:MM", "prefer_time_end": "HH:MM", "duration_minutes": 30}
Use null for unspecified fields. Interpret relative dates from today."""


def extract_json_object(text):
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith('```'):
        parts = cleaned.split('```')
        if len(parts) > 1:
            cleaned = parts[1].strip()
            if cleaned.startswith('json'):
                cleaned = cleaned[4:].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def normalize_constraints(parsed):
    if not isinstance(parsed, dict):
        return None

    normalized = {
        'after_date': parsed.get('after_date'),
        'before_date': parsed.get('before_date'),
        'prefer_time_start': parsed.get('prefer_time_start'),
        'prefer_time_end': parsed.get('prefer_time_end'),
        'duration_minutes': parsed.get('duration_minutes') or 30,
    }
    return normalized

def parse_with_openai(prompt):
    try:
        import openai
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": JSON_PARSE_PROMPT
            }, {
                "role": "user",
                "content": f"Today is {date.today().isoformat()}.\n\nRequest: {prompt}"
            }],
            temperature=0
        )
        text = response.choices[0].message.content.strip()
        return normalize_constraints(extract_json_object(text))
    except Exception as e:
        return None

def parse_with_gemini(prompt):
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            f"""{JSON_PARSE_PROMPT}
Today is {date.today().isoformat()}.

Request: {prompt}"""
        )
        text = getattr(response, 'text', '').strip()
        return normalize_constraints(extract_json_object(text))
    except Exception:
        return None

def parse_request(prompt):
    gemini_key = os.getenv('GEMINI_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')

    if gemini_key:
        parsed = parse_with_gemini(prompt)
        if parsed:
            return parsed, 'gemini'
    if openai_key:
        parsed = parse_with_openai(prompt)
        if parsed:
            return parsed, 'openai'
    return parse_with_rules(prompt), 'rules'


def parse_with_rules(prompt):
    text = (prompt or '').lower()
    today = date.today()
    after = today
    before = today + timedelta(days=14)
    prefer_time_start = None
    prefer_time_end = None

    weekday_map = {
        'monday': 0,
        'tuesday': 1,
        'wednesday': 2,
        'thursday': 3,
        'friday': 4,
        'saturday': 5,
        'sunday': 6,
    }

    if 'tomorrow' in text:
        after = today + timedelta(days=1)
        before = after
    elif 'next week' in text:
        days_to_next_monday = (7 - today.weekday()) or 7
        after = today + timedelta(days=days_to_next_monday)
        before = after + timedelta(days=6)
    elif 'this week' in text:
        before = today + timedelta(days=max(0, 6 - today.weekday()))

    for name, weekday in weekday_map.items():
        if name in text:
            offset = (weekday - today.weekday()) % 7
            target = today + timedelta(days=offset)
            if 'next' in text and offset == 0:
                target += timedelta(days=7)
            after = target
            before = target
            break

    if 'morning' in text:
        prefer_time_start = '08:00'
        prefer_time_end = '12:00'
    elif 'afternoon' in text:
        prefer_time_start = '12:00'
        prefer_time_end = '17:00'
    elif 'evening' in text:
        prefer_time_start = '16:00'
        prefer_time_end = '19:00'

    after_match = re.search(r'after\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text)
    before_match = re.search(r'before\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text)

    def normalize_hour(hour, minute, meridiem):
        hour = int(hour)
        minute = int(minute or 0)
        if meridiem == 'pm' and hour != 12:
            hour += 12
        if meridiem == 'am' and hour == 12:
            hour = 0
        return f'{hour:02d}:{minute:02d}'

    if after_match:
        prefer_time_start = normalize_hour(*after_match.groups())
    if before_match:
        prefer_time_end = normalize_hour(*before_match.groups())

    return {
        'after_date': after.isoformat(),
        'before_date': before.isoformat(),
        'prefer_time_start': prefer_time_start,
        'prefer_time_end': prefer_time_end,
        'duration_minutes': 30
    }

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
    
    constraints, provider = parse_request(prompt)
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
        'constraints': constraints,
        'provider': provider
    })
