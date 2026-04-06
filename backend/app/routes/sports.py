from flask import Blueprint, request, g
from app import db
from app.models.sports import (
    Sport, SportsTeam, Tournament, TournamentMatch,
    Club, ClubMember, Event, FacilityBooking, FitnessRecord, Certificate
)
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate

sports_bp = Blueprint('sports', __name__)


# ==================== DASHBOARD ====================
@sports_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('sports')
def dashboard():
    sid = g.school_id
    total_sports = Sport.query.filter_by(school_id=sid, is_active=True).count()
    total_teams = SportsTeam.query.filter_by(school_id=sid, is_active=True).count()
    upcoming_tournaments = Tournament.query.filter_by(school_id=sid, status='upcoming').count()
    ongoing_tournaments = Tournament.query.filter_by(school_id=sid, status='ongoing').count()
    total_clubs = Club.query.filter_by(school_id=sid, is_active=True).count()
    total_members = ClubMember.query.filter_by(school_id=sid, status='active').count()
    upcoming_events = Event.query.filter_by(school_id=sid, status='planning').count()
    pending_bookings = FacilityBooking.query.filter_by(school_id=sid, status='pending').count()
    total_certificates = Certificate.query.filter_by(school_id=sid, is_active=True).count()
    return success_response(data={
        'total_sports': total_sports, 'total_teams': total_teams,
        'upcoming_tournaments': upcoming_tournaments, 'ongoing_tournaments': ongoing_tournaments,
        'total_clubs': total_clubs, 'total_members': total_members,
        'upcoming_events': upcoming_events, 'pending_bookings': pending_bookings,
        'total_certificates': total_certificates,
    })


# ==================== SPORTS ====================
@sports_bp.route('/sports', methods=['GET'])
@school_required
@feature_required('sports')
def list_sports():
    q = Sport.query.filter_by(school_id=g.school_id)
    cat = request.args.get('category')
    if cat: q = q.filter_by(category=cat)
    q = q.order_by(Sport.name)
    return success_response(data=paginate(q))

@sports_bp.route('/sports', methods=['POST'])
@school_required
@feature_required('sports')
def create_sport():
    data = request.get_json()
    s = Sport(school_id=g.school_id, name=data['name'],
        category=data.get('category'), max_team_size=data.get('max_team_size', 15),
        coach_id=data.get('coach_id'), description=data.get('description'),
        season=data.get('season'), practice_schedule=data.get('practice_schedule'))
    db.session.add(s)
    db.session.commit()
    return success_response(data=s.to_dict(), message='Sport created')

@sports_bp.route('/sports/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_sport(id):
    s = Sport.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'category', 'max_team_size', 'coach_id', 'description', 'season', 'practice_schedule', 'is_active']:
        if k in data: setattr(s, k, data[k])
    db.session.commit()
    return success_response(data=s.to_dict(), message='Sport updated')

@sports_bp.route('/sports/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_sport(id):
    s = Sport.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(s)
    db.session.commit()
    return success_response(message='Sport deleted')


# ==================== TEAMS ====================
@sports_bp.route('/teams', methods=['GET'])
@school_required
@feature_required('sports')
def list_teams():
    q = SportsTeam.query.filter_by(school_id=g.school_id)
    sport_id = request.args.get('sport_id')
    if sport_id: q = q.filter_by(sport_id=sport_id)
    q = q.order_by(SportsTeam.name)
    return success_response(data=paginate(q))

@sports_bp.route('/teams', methods=['POST'])
@school_required
@feature_required('sports')
def create_team():
    data = request.get_json()
    t = SportsTeam(school_id=g.school_id, sport_id=data.get('sport_id'),
        name=data['name'], academic_year=data.get('academic_year'),
        captain_id=data.get('captain_id'), coach_id=data.get('coach_id'),
        members=data.get('members'), age_group=data.get('age_group'),
        achievements=data.get('achievements'))
    db.session.add(t)
    db.session.commit()
    return success_response(data=t.to_dict(), message='Team created')

@sports_bp.route('/teams/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_team(id):
    t = SportsTeam.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['sport_id', 'name', 'academic_year', 'captain_id', 'coach_id', 'members', 'age_group', 'achievements', 'is_active']:
        if k in data: setattr(t, k, data[k])
    db.session.commit()
    return success_response(data=t.to_dict(), message='Team updated')

@sports_bp.route('/teams/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_team(id):
    t = SportsTeam.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(t)
    db.session.commit()
    return success_response(message='Team deleted')


# ==================== TOURNAMENTS ====================
@sports_bp.route('/tournaments', methods=['GET'])
@school_required
@feature_required('sports')
def list_tournaments():
    q = Tournament.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status: q = q.filter_by(status=status)
    q = q.order_by(Tournament.start_date.desc())
    return success_response(data=paginate(q))

@sports_bp.route('/tournaments', methods=['POST'])
@school_required
@feature_required('sports')
def create_tournament():
    data = request.get_json()
    t = Tournament(school_id=g.school_id, sport_id=data.get('sport_id'),
        name=data['name'], tournament_type=data.get('tournament_type'),
        start_date=data.get('start_date'), end_date=data.get('end_date'),
        venue=data.get('venue'), organizer=data.get('organizer'),
        remarks=data.get('remarks'))
    db.session.add(t)
    db.session.commit()
    return success_response(data=t.to_dict(), message='Tournament created')

@sports_bp.route('/tournaments/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_tournament(id):
    t = Tournament.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['sport_id', 'name', 'tournament_type', 'start_date', 'end_date', 'venue', 'organizer', 'status', 'result', 'medals', 'remarks', 'is_active']:
        if k in data: setattr(t, k, data[k])
    db.session.commit()
    return success_response(data=t.to_dict(), message='Tournament updated')

@sports_bp.route('/tournaments/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_tournament(id):
    t = Tournament.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(t)
    db.session.commit()
    return success_response(message='Tournament deleted')


# ==================== MATCHES ====================
@sports_bp.route('/matches', methods=['GET'])
@school_required
@feature_required('sports')
def list_matches():
    q = TournamentMatch.query.filter_by(school_id=g.school_id)
    tid = request.args.get('tournament_id')
    if tid: q = q.filter_by(tournament_id=tid)
    q = q.order_by(TournamentMatch.match_date.desc())
    return success_response(data=paginate(q))

@sports_bp.route('/matches', methods=['POST'])
@school_required
@feature_required('sports')
def create_match():
    data = request.get_json()
    m = TournamentMatch(school_id=g.school_id, tournament_id=data.get('tournament_id'),
        team_id=data.get('team_id'), opponent=data.get('opponent'),
        match_date=data.get('match_date'), match_time=data.get('match_time'),
        venue=data.get('venue'), remarks=data.get('remarks'))
    db.session.add(m)
    db.session.commit()
    return success_response(data=m.to_dict(), message='Match created')

@sports_bp.route('/matches/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_match(id):
    m = TournamentMatch.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['tournament_id', 'team_id', 'opponent', 'match_date', 'match_time', 'venue', 'result', 'score', 'remarks']:
        if k in data: setattr(m, k, data[k])
    db.session.commit()
    return success_response(data=m.to_dict(), message='Match updated')

@sports_bp.route('/matches/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_match(id):
    m = TournamentMatch.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return success_response(message='Match deleted')


# ==================== CLUBS ====================
@sports_bp.route('/clubs', methods=['GET'])
@school_required
@feature_required('sports')
def list_clubs():
    q = Club.query.filter_by(school_id=g.school_id)
    cat = request.args.get('category')
    if cat: q = q.filter_by(category=cat)
    q = q.order_by(Club.name)
    return success_response(data=paginate(q))

@sports_bp.route('/clubs', methods=['POST'])
@school_required
@feature_required('sports')
def create_club():
    data = request.get_json()
    c = Club(school_id=g.school_id, name=data['name'],
        category=data.get('category'), description=data.get('description'),
        advisor_id=data.get('advisor_id'), president_id=data.get('president_id'),
        meeting_schedule=data.get('meeting_schedule'), max_members=data.get('max_members', 50),
        achievements=data.get('achievements'))
    db.session.add(c)
    db.session.commit()
    return success_response(data=c.to_dict(), message='Club created')

@sports_bp.route('/clubs/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_club(id):
    c = Club.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'category', 'description', 'advisor_id', 'president_id', 'meeting_schedule', 'max_members', 'achievements', 'is_active']:
        if k in data: setattr(c, k, data[k])
    db.session.commit()
    return success_response(data=c.to_dict(), message='Club updated')

@sports_bp.route('/clubs/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_club(id):
    c = Club.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(c)
    db.session.commit()
    return success_response(message='Club deleted')


# ==================== CLUB MEMBERS ====================
@sports_bp.route('/club-members', methods=['GET'])
@school_required
@feature_required('sports')
def list_club_members():
    q = ClubMember.query.filter_by(school_id=g.school_id)
    club_id = request.args.get('club_id')
    if club_id: q = q.filter_by(club_id=club_id)
    return success_response(data=paginate(q))

@sports_bp.route('/club-members', methods=['POST'])
@school_required
@feature_required('sports')
def add_club_member():
    data = request.get_json()
    m = ClubMember(school_id=g.school_id, club_id=data['club_id'],
        student_id=data['student_id'], role=data.get('role', 'member'),
        joined_date=data.get('joined_date'))
    db.session.add(m)
    db.session.commit()
    return success_response(data=m.to_dict(), message='Member added')

@sports_bp.route('/club-members/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_club_member(id):
    m = ClubMember.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['role', 'status']:
        if k in data: setattr(m, k, data[k])
    db.session.commit()
    return success_response(data=m.to_dict(), message='Member updated')

@sports_bp.route('/club-members/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def remove_club_member(id):
    m = ClubMember.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return success_response(message='Member removed')


# ==================== EVENTS ====================
@sports_bp.route('/events', methods=['GET'])
@school_required
@feature_required('sports')
def list_events():
    q = Event.query.filter_by(school_id=g.school_id)
    etype = request.args.get('event_type')
    if etype: q = q.filter_by(event_type=etype)
    status = request.args.get('status')
    if status: q = q.filter_by(status=status)
    q = q.order_by(Event.start_date.desc())
    return success_response(data=paginate(q))

@sports_bp.route('/events', methods=['POST'])
@school_required
@feature_required('sports')
def create_event():
    data = request.get_json()
    e = Event(school_id=g.school_id, name=data['name'],
        event_type=data.get('event_type'), description=data.get('description'),
        start_date=data.get('start_date'), end_date=data.get('end_date'),
        venue=data.get('venue'), organizer_id=data.get('organizer_id'),
        budget=data.get('budget', 0), participants=data.get('participants'),
        remarks=data.get('remarks'))
    db.session.add(e)
    db.session.commit()
    return success_response(data=e.to_dict(), message='Event created')

@sports_bp.route('/events/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_event(id):
    e = Event.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'event_type', 'description', 'start_date', 'end_date', 'venue', 'organizer_id', 'budget', 'status', 'participants', 'remarks', 'is_active']:
        if k in data: setattr(e, k, data[k])
    db.session.commit()
    return success_response(data=e.to_dict(), message='Event updated')

@sports_bp.route('/events/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_event(id):
    e = Event.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(e)
    db.session.commit()
    return success_response(message='Event deleted')


# ==================== FACILITY BOOKINGS ====================
@sports_bp.route('/bookings', methods=['GET'])
@school_required
@feature_required('sports')
def list_bookings():
    q = FacilityBooking.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status: q = q.filter_by(status=status)
    q = q.order_by(FacilityBooking.booking_date.desc())
    return success_response(data=paginate(q))

@sports_bp.route('/bookings', methods=['POST'])
@school_required
@feature_required('sports')
def create_booking():
    data = request.get_json()
    b = FacilityBooking(school_id=g.school_id, facility_name=data['facility_name'],
        facility_type=data.get('facility_type'), booked_by=data.get('booked_by'),
        booking_date=data['booking_date'], start_time=data.get('start_time'),
        end_time=data.get('end_time'), purpose=data.get('purpose'),
        remarks=data.get('remarks'))
    db.session.add(b)
    db.session.commit()
    return success_response(data=b.to_dict(), message='Booking created')

@sports_bp.route('/bookings/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_booking(id):
    b = FacilityBooking.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['facility_name', 'facility_type', 'booking_date', 'start_time', 'end_time', 'purpose', 'status', 'approved_by', 'remarks']:
        if k in data: setattr(b, k, data[k])
    db.session.commit()
    return success_response(data=b.to_dict(), message='Booking updated')

@sports_bp.route('/bookings/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_booking(id):
    b = FacilityBooking.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(b)
    db.session.commit()
    return success_response(message='Booking deleted')


# ==================== FITNESS RECORDS ====================
@sports_bp.route('/fitness', methods=['GET'])
@school_required
@feature_required('sports')
def list_fitness():
    q = FitnessRecord.query.filter_by(school_id=g.school_id)
    sid = request.args.get('student_id')
    if sid: q = q.filter_by(student_id=sid)
    q = q.order_by(FitnessRecord.test_date.desc())
    return success_response(data=paginate(q))

@sports_bp.route('/fitness', methods=['POST'])
@school_required
@feature_required('sports')
def create_fitness():
    data = request.get_json()
    f = FitnessRecord(school_id=g.school_id, student_id=data['student_id'],
        academic_year=data.get('academic_year'), test_date=data.get('test_date'),
        height=data.get('height'), weight=data.get('weight'),
        bmi=data.get('bmi'), sprint_50m=data.get('sprint_50m'),
        long_jump=data.get('long_jump'), flexibility=data.get('flexibility'),
        endurance=data.get('endurance'), overall_grade=data.get('overall_grade'),
        remarks=data.get('remarks'), tested_by=data.get('tested_by'))
    db.session.add(f)
    db.session.commit()
    return success_response(data=f.to_dict(), message='Fitness record created')

@sports_bp.route('/fitness/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_fitness(id):
    f = FitnessRecord.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['academic_year', 'test_date', 'height', 'weight', 'bmi', 'sprint_50m', 'long_jump', 'flexibility', 'endurance', 'overall_grade', 'remarks', 'tested_by']:
        if k in data: setattr(f, k, data[k])
    db.session.commit()
    return success_response(data=f.to_dict(), message='Fitness record updated')

@sports_bp.route('/fitness/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_fitness(id):
    f = FitnessRecord.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(f)
    db.session.commit()
    return success_response(message='Fitness record deleted')


# ==================== CERTIFICATES ====================
@sports_bp.route('/certificates', methods=['GET'])
@school_required
@feature_required('sports')
def list_certificates():
    q = Certificate.query.filter_by(school_id=g.school_id)
    ctype = request.args.get('certificate_type')
    if ctype: q = q.filter_by(certificate_type=ctype)
    q = q.order_by(Certificate.issued_date.desc())
    return success_response(data=paginate(q))

@sports_bp.route('/certificates', methods=['POST'])
@school_required
@feature_required('sports')
def create_certificate():
    data = request.get_json()
    c = Certificate(school_id=g.school_id, student_id=data.get('student_id'),
        certificate_type=data.get('certificate_type'), event_name=data.get('event_name'),
        issued_date=data.get('issued_date'), description=data.get('description'),
        position=data.get('position'), issued_by=data.get('issued_by'),
        template=data.get('template'))
    db.session.add(c)
    db.session.commit()
    return success_response(data=c.to_dict(), message='Certificate created')

@sports_bp.route('/certificates/<int:id>', methods=['PUT'])
@school_required
@feature_required('sports')
def update_certificate(id):
    c = Certificate.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['student_id', 'certificate_type', 'event_name', 'issued_date', 'description', 'position', 'issued_by', 'template']:
        if k in data: setattr(c, k, data[k])
    db.session.commit()
    return success_response(data=c.to_dict(), message='Certificate updated')

@sports_bp.route('/certificates/<int:id>', methods=['DELETE'])
@school_required
@feature_required('sports')
def delete_certificate(id):
    c = Certificate.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(c)
    db.session.commit()
    return success_response(message='Certificate deleted')
