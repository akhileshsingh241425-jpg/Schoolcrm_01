from app import db
from datetime import datetime


class LibraryCategory(db.Model):
    __tablename__ = 'library_categories'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LibraryBook(db.Model):
    __tablename__ = 'library_books'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('library_categories.id'))
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255))
    isbn = db.Column(db.String(20))
    publisher = db.Column(db.String(255))
    edition = db.Column(db.String(50))
    language = db.Column(db.String(50), default='English')
    subject = db.Column(db.String(100))
    publication_year = db.Column(db.Integer)
    pages = db.Column(db.Integer)
    total_copies = db.Column(db.Integer, default=1)
    available_copies = db.Column(db.Integer, default=1)
    rack_no = db.Column(db.String(20))
    price = db.Column(db.Numeric(12, 2))
    condition = db.Column(db.Enum('new', 'good', 'fair', 'poor', 'damaged'), default='new')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship('LibraryCategory', backref='books')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'publisher': self.publisher,
            'edition': self.edition,
            'language': self.language,
            'subject': self.subject,
            'publication_year': self.publication_year,
            'pages': self.pages,
            'total_copies': self.total_copies,
            'available_copies': self.available_copies,
            'rack_no': self.rack_no,
            'price': float(self.price) if self.price else None,
            'condition': self.condition,
            'is_active': self.is_active,
            'category': self.category.to_dict() if self.category else None,
            'category_name': self.category.name if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BookCopy(db.Model):
    __tablename__ = 'book_copies'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('library_books.id', ondelete='CASCADE'), nullable=False)
    accession_no = db.Column(db.String(50), nullable=False)
    barcode = db.Column(db.String(100))
    condition = db.Column(db.Enum('new', 'good', 'fair', 'poor', 'damaged', 'lost'), default='new')
    location = db.Column(db.String(100))
    is_available = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    book = db.relationship('LibraryBook', backref='copies')

    def to_dict(self):
        return {
            'id': self.id, 'book_id': self.book_id,
            'accession_no': self.accession_no, 'barcode': self.barcode,
            'condition': self.condition, 'location': self.location,
            'is_available': self.is_available, 'notes': self.notes,
            'book_title': self.book.title if self.book else None,
            'book_author': self.book.author if self.book else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LibraryIssue(db.Model):
    __tablename__ = 'library_issues'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('library_books.id', ondelete='CASCADE'), nullable=False)
    copy_id = db.Column(db.Integer, db.ForeignKey('book_copies.id'))
    issued_to = db.Column(db.Integer, nullable=False)
    issued_to_type = db.Column(db.Enum('student', 'staff'), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    return_date = db.Column(db.Date)
    fine_amount = db.Column(db.Numeric(12, 2), default=0)
    fine_paid = db.Column(db.Boolean, default=False)
    status = db.Column(db.Enum('issued', 'returned', 'lost', 'overdue'), default='issued')
    notes = db.Column(db.Text)
    issued_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    book = db.relationship('LibraryBook', backref='issues')

    def to_dict(self):
        return {
            'id': self.id,
            'book': self.book.to_dict() if self.book else None,
            'book_title': self.book.title if self.book else None,
            'copy_id': self.copy_id,
            'issued_to': self.issued_to,
            'issued_to_type': self.issued_to_type,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'fine_amount': float(self.fine_amount) if self.fine_amount else 0,
            'fine_paid': self.fine_paid,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BookReservation(db.Model):
    __tablename__ = 'book_reservations'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('library_books.id', ondelete='CASCADE'), nullable=False)
    reserved_by = db.Column(db.Integer, nullable=False)
    reserved_by_type = db.Column(db.Enum('student', 'staff'), default='student')
    reservation_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date)
    status = db.Column(db.Enum('pending', 'fulfilled', 'cancelled', 'expired'), default='pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    book = db.relationship('LibraryBook', backref='reservations')

    def to_dict(self):
        return {
            'id': self.id, 'book_id': self.book_id,
            'book_title': self.book.title if self.book else None,
            'reserved_by': self.reserved_by,
            'reserved_by_type': self.reserved_by_type,
            'reservation_date': self.reservation_date.isoformat() if self.reservation_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BookFine(db.Model):
    __tablename__ = 'book_fines'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    issue_id = db.Column(db.Integer, db.ForeignKey('library_issues.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, nullable=False)
    fine_type = db.Column(db.Enum('overdue', 'lost', 'damaged'), default='overdue')
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    paid_amount = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(db.Enum('pending', 'paid', 'waived'), default='pending')
    paid_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    issue = db.relationship('LibraryIssue', backref='fines')

    def to_dict(self):
        return {
            'id': self.id, 'issue_id': self.issue_id,
            'student_id': self.student_id,
            'fine_type': self.fine_type,
            'amount': float(self.amount) if self.amount else 0,
            'paid_amount': float(self.paid_amount) if self.paid_amount else 0,
            'status': self.status,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'notes': self.notes,
            'book_title': self.issue.book.title if self.issue and self.issue.book else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class EbookResource(db.Model):
    __tablename__ = 'ebook_resources'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255))
    resource_type = db.Column(db.Enum('ebook', 'pdf', 'journal', 'article', 'video'), default='ebook')
    subject = db.Column(db.String(100))
    url = db.Column(db.String(500))
    file_path = db.Column(db.String(500))
    description = db.Column(db.Text)
    access_level = db.Column(db.Enum('all', 'students', 'staff', 'restricted'), default='all')
    is_active = db.Column(db.Boolean, default=True)
    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'author': self.author,
            'resource_type': self.resource_type, 'subject': self.subject,
            'url': self.url, 'file_path': self.file_path,
            'description': self.description, 'access_level': self.access_level,
            'is_active': self.is_active, 'download_count': self.download_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Periodical(db.Model):
    __tablename__ = 'periodicals'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    periodical_type = db.Column(db.Enum('magazine', 'journal', 'newspaper'), default='magazine')
    publisher = db.Column(db.String(255))
    frequency = db.Column(db.Enum('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'), default='monthly')
    subscription_start = db.Column(db.Date)
    subscription_end = db.Column(db.Date)
    subscription_cost = db.Column(db.Numeric(12, 2))
    status = db.Column(db.Enum('active', 'expired', 'cancelled'), default='active')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title,
            'periodical_type': self.periodical_type,
            'publisher': self.publisher, 'frequency': self.frequency,
            'subscription_start': self.subscription_start.isoformat() if self.subscription_start else None,
            'subscription_end': self.subscription_end.isoformat() if self.subscription_end else None,
            'subscription_cost': float(self.subscription_cost) if self.subscription_cost else 0,
            'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ReadingHistory(db.Model):
    __tablename__ = 'reading_history'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('library_books.id', ondelete='CASCADE'), nullable=False)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    rating = db.Column(db.Integer)
    review = db.Column(db.Text)
    pages_read = db.Column(db.Integer)
    status = db.Column(db.Enum('reading', 'completed', 'abandoned'), default='reading')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    book = db.relationship('LibraryBook', backref='reading_records')

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'book_id': self.book_id,
            'book_title': self.book.title if self.book else None,
            'book_author': self.book.author if self.book else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'rating': self.rating, 'review': self.review,
            'pages_read': self.pages_read, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LibraryBudget(db.Model):
    __tablename__ = 'library_budget'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    category = db.Column(db.Enum('books', 'periodicals', 'ebooks', 'furniture', 'equipment', 'other'), default='books')
    allocated_amount = db.Column(db.Numeric(12, 2), nullable=False)
    spent_amount = db.Column(db.Numeric(12, 2), default=0)
    description = db.Column(db.Text)
    status = db.Column(db.Enum('planned', 'approved', 'in_progress', 'completed'), default='planned')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'academic_year': self.academic_year,
            'category': self.category,
            'allocated_amount': float(self.allocated_amount) if self.allocated_amount else 0,
            'spent_amount': float(self.spent_amount) if self.spent_amount else 0,
            'remaining': float(self.allocated_amount or 0) - float(self.spent_amount or 0),
            'description': self.description, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
