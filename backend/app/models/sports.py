from app import db
from datetime import datetime


class Sport(db.Model):
    __tablename__ = 'sports'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))  # indoor, outdoor, water, athletics
    max_team_size = db.Column(db.Integer, default=15)
    coach_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    description = db.Column(db.Text)
    season = db.Column(db.String(50))  # summer, winter, year-round
    practice_schedule = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}


class SportsTeam(db.Model):
    __tablename__ = 'sports_teams'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    sport_id = db.Column(db.Integer, db.ForeignKey('sports.id'))
    name = db.Column(db.String(100), nullable=False)
    academic_year = db.Column(db.String(20))
    captain_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    coach_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    members = db.Column(db.Text)  # JSON list of student IDs
    age_group = db.Column(db.String(50))  # U-14, U-17, Senior
    achievements = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}


class Tournament(db.Model):
    __tablename__ = 'tournaments'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    sport_id = db.Column(db.Integer, db.ForeignKey('sports.id'))
    name = db.Column(db.String(200), nullable=False)
    tournament_type = db.Column(db.String(50))  # inter-school, intra-school, district, state, national
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    venue = db.Column(db.String(200))
    organizer = db.Column(db.String(200))
    status = db.Column(db.String(30), default='upcoming')  # upcoming, ongoing, completed, cancelled
    result = db.Column(db.Text)
    medals = db.Column(db.Text)  # JSON: {gold: 0, silver: 0, bronze: 0}
    remarks = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}


class TournamentMatch(db.Model):
    __tablename__ = 'tournament_matches'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'))
    team_id = db.Column(db.Integer, db.ForeignKey('sports_teams.id'))
    opponent = db.Column(db.String(200))
    match_date = db.Column(db.Date)
    match_time = db.Column(db.String(20))
    venue = db.Column(db.String(200))
    result = db.Column(db.String(50))  # won, lost, draw, pending
    score = db.Column(db.String(100))
    remarks = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}


class Club(db.Model):
    __tablename__ = 'clubs'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))  # literary, science, arts, cultural, social
    description = db.Column(db.Text)
    advisor_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    president_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    meeting_schedule = db.Column(db.String(200))
    max_members = db.Column(db.Integer, default=50)
    achievements = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}


class ClubMember(db.Model):
    __tablename__ = 'club_members'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    role = db.Column(db.String(50), default='member')  # member, secretary, treasurer, president
    joined_date = db.Column(db.Date)
    status = db.Column(db.String(30), default='active')  # active, inactive, alumni
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}


class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    event_type = db.Column(db.String(50))  # academic, cultural, sports, social, annual
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    venue = db.Column(db.String(200))
    organizer_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    budget = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(db.String(30), default='planning')  # planning, approved, ongoing, completed, cancelled
    participants = db.Column(db.Text)
    remarks = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}


class FacilityBooking(db.Model):
    __tablename__ = 'facility_bookings'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    facility_name = db.Column(db.String(100), nullable=False)
    facility_type = db.Column(db.String(50))  # court, pool, lab, hall, ground, auditorium
    booked_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    booking_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(20))
    end_time = db.Column(db.String(20))
    purpose = db.Column(db.String(300))
    status = db.Column(db.String(30), default='pending')  # pending, approved, rejected, cancelled
    approved_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    remarks = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}


class FitnessRecord(db.Model):
    __tablename__ = 'fitness_records'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    academic_year = db.Column(db.String(20))
    test_date = db.Column(db.Date)
    height = db.Column(db.Numeric(5, 2))
    weight = db.Column(db.Numeric(5, 2))
    bmi = db.Column(db.Numeric(5, 2))
    sprint_50m = db.Column(db.String(20))
    long_jump = db.Column(db.String(20))
    flexibility = db.Column(db.String(20))
    endurance = db.Column(db.String(20))
    overall_grade = db.Column(db.String(5))  # A, B, C, D
    remarks = db.Column(db.Text)
    tested_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}


class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    certificate_type = db.Column(db.String(50))  # participation, winner, merit, appreciation
    event_name = db.Column(db.String(200))
    issued_date = db.Column(db.Date)
    description = db.Column(db.Text)
    position = db.Column(db.String(50))  # 1st, 2nd, 3rd, participant
    issued_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    template = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), (datetime,)) else (str(getattr(self, c.name)) if hasattr(getattr(self, c.name), 'isoformat') else getattr(self, c.name))) for c in self.__table__.columns}
