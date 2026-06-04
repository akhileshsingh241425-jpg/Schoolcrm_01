"""Online Exam / Quiz Module Models.
Covers: QuestionBank, Question, OnlineExam, OnlineExamQuestion, StudentExamAttempt, StudentAnswer.
"""
from app import db
from datetime import datetime


class QuestionBank(db.Model):
    """Collection of questions grouped by subject/class."""
    __tablename__ = 'question_banks'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='SET NULL'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='SET NULL'))
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship('Subject', backref='question_banks')
    class_ref = db.relationship('Class', backref='question_banks')
    questions = db.relationship('Question', backref='question_bank', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'title': self.title,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'description': self.description,
            'created_by': self.created_by,
            'is_active': self.is_active,
            'question_count': self.questions.count() if self.questions else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Question(db.Model):
    """Individual question belonging to a question bank."""
    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    question_bank_id = db.Column(db.Integer, db.ForeignKey('question_banks.id', ondelete='CASCADE'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False, default='mcq')  # mcq, true_false, short_answer, fill_blank
    option_a = db.Column(db.Text)
    option_b = db.Column(db.Text)
    option_c = db.Column(db.Text)
    option_d = db.Column(db.Text)
    correct_answer = db.Column(db.String(500), nullable=False)
    marks = db.Column(db.Numeric(5, 2), default=1)
    difficulty = db.Column(db.String(10), default='medium')  # easy, medium, hard
    explanation = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'question_bank_id': self.question_bank_id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'correct_answer': self.correct_answer,
            'marks': float(self.marks) if self.marks else 1,
            'difficulty': self.difficulty,
            'explanation': self.explanation,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def to_student_dict(self):
        """Dict without correct answer — for student-facing views."""
        return {
            'id': self.id,
            'question_text': self.question_text,
            'question_type': self.question_type,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'marks': float(self.marks) if self.marks else 1,
            'difficulty': self.difficulty,
            'image_url': self.image_url,
        }


class OnlineExam(db.Model):
    """Online exam/quiz configuration."""
    __tablename__ = 'online_exams'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    exam_type = db.Column(db.String(20), default='quiz')  # quiz, test, practice, mock
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='SET NULL'))
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id', ondelete='SET NULL'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='SET NULL'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, nullable=False, default=30)
    max_marks = db.Column(db.Numeric(6, 2), default=0)
    passing_marks = db.Column(db.Numeric(6, 2), default=0)
    total_questions = db.Column(db.Integer, default=0)
    is_randomized = db.Column(db.Boolean, default=False)
    show_result_immediately = db.Column(db.Boolean, default=True)
    allow_review = db.Column(db.Boolean, default=True)
    max_attempts = db.Column(db.Integer, default=1)
    is_published = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ref = db.relationship('Class', backref='online_exams')
    section_ref = db.relationship('Section', backref='online_exams')
    subject_ref = db.relationship('Subject', backref='online_exams')
    exam_questions = db.relationship('OnlineExamQuestion', backref='online_exam', lazy='dynamic', cascade='all, delete-orphan')
    attempts = db.relationship('StudentExamAttempt', backref='online_exam', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'title': self.title,
            'description': self.description,
            'exam_type': self.exam_type,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_id': self.section_id,
            'section_name': self.section_ref.name if self.section_ref else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject_ref.name if self.subject_ref else None,
            'created_by': self.created_by,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'max_marks': float(self.max_marks) if self.max_marks else 0,
            'passing_marks': float(self.passing_marks) if self.passing_marks else 0,
            'total_questions': self.total_questions,
            'is_randomized': self.is_randomized,
            'show_result_immediately': self.show_result_immediately,
            'allow_review': self.allow_review,
            'max_attempts': self.max_attempts,
            'is_published': self.is_published,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class OnlineExamQuestion(db.Model):
    """Maps questions to an online exam with ordering."""
    __tablename__ = 'online_exam_questions'

    id = db.Column(db.Integer, primary_key=True)
    online_exam_id = db.Column(db.Integer, db.ForeignKey('online_exams.id', ondelete='CASCADE'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    question_order = db.Column(db.Integer, default=0)
    marks = db.Column(db.Numeric(5, 2), default=1)

    question = db.relationship('Question', backref='exam_mappings')

    __table_args__ = (
        db.UniqueConstraint('online_exam_id', 'question_id', name='unique_exam_question'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'online_exam_id': self.online_exam_id,
            'question_id': self.question_id,
            'question_order': self.question_order,
            'marks': float(self.marks) if self.marks else 1,
            'question': self.question.to_dict() if self.question else None,
        }


class StudentExamAttempt(db.Model):
    """Tracks a student's attempt at an online exam."""
    __tablename__ = 'student_exam_attempts'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    online_exam_id = db.Column(db.Integer, db.ForeignKey('online_exams.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    attempt_number = db.Column(db.Integer, default=1)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    time_taken_seconds = db.Column(db.Integer)
    total_marks = db.Column(db.Numeric(6, 2), default=0)
    marks_obtained = db.Column(db.Numeric(6, 2), default=0)
    percentage = db.Column(db.Numeric(5, 2), default=0)
    is_passed = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='in_progress')  # in_progress, submitted, auto_submitted, graded
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='exam_attempts')
    answers = db.relationship('StudentAnswer', backref='attempt', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        s = self.student
        return {
            'id': self.id,
            'school_id': self.school_id,
            'online_exam_id': self.online_exam_id,
            'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'admission_no': s.admission_no if s else None,
            'attempt_number': self.attempt_number,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'time_taken_seconds': self.time_taken_seconds,
            'total_marks': float(self.total_marks) if self.total_marks else 0,
            'marks_obtained': float(self.marks_obtained) if self.marks_obtained else 0,
            'percentage': float(self.percentage) if self.percentage else 0,
            'is_passed': self.is_passed,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class StudentAnswer(db.Model):
    """Individual answer submitted by a student for a question."""
    __tablename__ = 'student_answers'

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('student_exam_attempts.id', ondelete='CASCADE'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    selected_answer = db.Column(db.Text)
    is_correct = db.Column(db.Boolean)
    marks_awarded = db.Column(db.Numeric(5, 2), default=0)

    question = db.relationship('Question')

    __table_args__ = (
        db.UniqueConstraint('attempt_id', 'question_id', name='unique_attempt_question'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'selected_answer': self.selected_answer,
            'is_correct': self.is_correct,
            'marks_awarded': float(self.marks_awarded) if self.marks_awarded else 0,
            'question': self.question.to_dict() if self.question else None,
        }
