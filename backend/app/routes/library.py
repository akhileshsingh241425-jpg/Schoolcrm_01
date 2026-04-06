from flask import Blueprint, request, g
from datetime import date, timedelta
import requests as http_requests
from app import db
from app.models.library import (
    LibraryCategory, LibraryBook, BookCopy, LibraryIssue,
    BookReservation, BookFine, EbookResource, Periodical,
    ReadingHistory, LibraryBudget
)
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload

library_bp = Blueprint('library', __name__)


# ── Dashboard ──────────────────────────────────────────────
@library_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('library')
def dashboard():
    sid = g.school_id
    total_books = LibraryBook.query.filter_by(school_id=sid).count()
    total_copies = BookCopy.query.filter_by(school_id=sid).count()
    issued = LibraryIssue.query.filter_by(school_id=sid, status='issued').count()
    overdue = LibraryIssue.query.filter(
        LibraryIssue.school_id == sid,
        LibraryIssue.status == 'issued',
        LibraryIssue.due_date < date.today()
    ).count()
    returned = LibraryIssue.query.filter_by(school_id=sid, status='returned').count()
    reservations = BookReservation.query.filter_by(school_id=sid, status='pending').count()
    pending_fines = db.session.query(db.func.coalesce(db.func.sum(BookFine.amount - BookFine.paid_amount), 0)).filter(
        BookFine.school_id == sid, BookFine.status == 'pending'
    ).scalar()
    ebooks = EbookResource.query.filter_by(school_id=sid, is_active=True).count()
    periodicals = Periodical.query.filter_by(school_id=sid, status='active').count()
    categories = LibraryCategory.query.filter_by(school_id=sid).count()
    lost = LibraryIssue.query.filter_by(school_id=sid, status='lost').count()
    budget_allocated = db.session.query(db.func.coalesce(db.func.sum(LibraryBudget.allocated_amount), 0)).filter_by(school_id=sid).scalar()

    return success_response({
        'total_books': total_books, 'total_copies': total_copies,
        'issued': issued, 'overdue': overdue, 'returned': returned,
        'reservations': reservations, 'pending_fines': float(pending_fines),
        'ebooks': ebooks, 'periodicals': periodicals,
        'categories': categories, 'lost': lost,
        'budget_allocated': float(budget_allocated)
    })


# ── Categories ─────────────────────────────────────────────
@library_bp.route('/categories', methods=['GET'])
@school_required
@feature_required('library')
def list_categories():
    cats = LibraryCategory.query.filter_by(school_id=g.school_id).all()
    return success_response([c.to_dict() for c in cats])


@library_bp.route('/categories', methods=['POST'])
@role_required('school_admin', 'librarian')
def create_category():
    data = request.get_json()
    cat = LibraryCategory(school_id=g.school_id, name=data['name'], description=data.get('description'))
    db.session.add(cat)
    db.session.commit()
    return success_response(cat.to_dict(), 'Category created', 201)


@library_bp.route('/categories/<int:cid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_category(cid):
    cat = LibraryCategory.query.filter_by(id=cid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'description', 'is_active']:
        if k in data:
            setattr(cat, k, data[k])
    db.session.commit()
    return success_response(cat.to_dict(), 'Category updated')


@library_bp.route('/categories/<int:cid>', methods=['DELETE'])
@role_required('school_admin', 'librarian')
def delete_category(cid):
    cat = LibraryCategory.query.filter_by(id=cid, school_id=g.school_id).first_or_404()
    db.session.delete(cat)
    db.session.commit()
    return success_response(None, 'Category deleted')


# ── Books ──────────────────────────────────────────────────
@library_bp.route('/books', methods=['GET'])
@school_required
@feature_required('library')
def list_books():
    query = LibraryBook.query.options(
        joinedload(LibraryBook.category)
    ).filter_by(school_id=g.school_id)
    search = request.args.get('search')
    if search:
        query = query.filter(db.or_(
            LibraryBook.title.ilike(f'%{search}%'),
            LibraryBook.author.ilike(f'%{search}%'),
            LibraryBook.isbn.ilike(f'%{search}%')
        ))
    category_id = request.args.get('category_id', type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)
    return success_response(paginate(query))


@library_bp.route('/books', methods=['POST'])
@role_required('school_admin', 'librarian')
def create_book():
    data = request.get_json()
    book = LibraryBook(
        school_id=g.school_id,
        category_id=data.get('category_id'),
        title=data['title'],
        author=data.get('author'),
        isbn=data.get('isbn'),
        publisher=data.get('publisher'),
        edition=data.get('edition'),
        language=data.get('language', 'English'),
        subject=data.get('subject'),
        publication_year=data.get('publication_year'),
        pages=data.get('pages'),
        total_copies=data.get('total_copies', 1),
        available_copies=data.get('total_copies', 1),
        rack_no=data.get('rack_no'),
        price=data.get('price'),
        condition=data.get('condition', 'new')
    )
    db.session.add(book)
    db.session.commit()
    return success_response(book.to_dict(), 'Book added', 201)


@library_bp.route('/books/<int:bid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_book(bid):
    book = LibraryBook.query.filter_by(id=bid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['title', 'author', 'isbn', 'publisher', 'edition', 'language', 'subject',
              'publication_year', 'pages', 'total_copies', 'available_copies',
              'rack_no', 'price', 'condition', 'category_id', 'is_active']:
        if k in data:
            setattr(book, k, data[k])
    db.session.commit()
    return success_response(book.to_dict(), 'Book updated')


@library_bp.route('/books/<int:bid>', methods=['DELETE'])
@role_required('school_admin', 'librarian')
def delete_book(bid):
    book = LibraryBook.query.filter_by(id=bid, school_id=g.school_id).first_or_404()
    db.session.delete(book)
    db.session.commit()
    return success_response(None, 'Book deleted')


# ── Book Copies ────────────────────────────────────────────
@library_bp.route('/copies', methods=['GET'])
@school_required
@feature_required('library')
def list_copies():
    query = BookCopy.query.options(
        joinedload(BookCopy.book)
    ).filter_by(school_id=g.school_id)
    book_id = request.args.get('book_id', type=int)
    if book_id:
        query = query.filter_by(book_id=book_id)
    return success_response(paginate(query))


@library_bp.route('/copies', methods=['POST'])
@role_required('school_admin', 'librarian')
def create_copy():
    data = request.get_json()
    copy = BookCopy(
        school_id=g.school_id,
        book_id=data['book_id'],
        accession_no=data['accession_no'],
        barcode=data.get('barcode'),
        condition=data.get('condition', 'new'),
        location=data.get('location'),
        notes=data.get('notes')
    )
    db.session.add(copy)
    db.session.commit()
    return success_response(copy.to_dict(), 'Copy added', 201)


@library_bp.route('/copies/<int:cid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_copy(cid):
    copy = BookCopy.query.filter_by(id=cid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['accession_no', 'barcode', 'condition', 'location', 'is_available', 'notes']:
        if k in data:
            setattr(copy, k, data[k])
    db.session.commit()
    return success_response(copy.to_dict(), 'Copy updated')


@library_bp.route('/copies/<int:cid>', methods=['DELETE'])
@role_required('school_admin', 'librarian')
def delete_copy(cid):
    copy = BookCopy.query.filter_by(id=cid, school_id=g.school_id).first_or_404()
    db.session.delete(copy)
    db.session.commit()
    return success_response(None, 'Copy deleted')


# ── Issues ─────────────────────────────────────────────────
@library_bp.route('/issues', methods=['GET'])
@school_required
@feature_required('library')
def list_issues():
    query = LibraryIssue.query.options(
        joinedload(LibraryIssue.book).joinedload(LibraryBook.category)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    overdue = request.args.get('overdue')
    if overdue:
        query = query.filter(LibraryIssue.status == 'issued', LibraryIssue.due_date < date.today())
    return success_response(paginate(query))


@library_bp.route('/issue', methods=['POST'])
@role_required('school_admin', 'librarian')
def issue_book():
    data = request.get_json()
    book = LibraryBook.query.filter_by(id=data['book_id'], school_id=g.school_id).first_or_404()
    if book.available_copies < 1:
        return error_response('No copies available')
    issue = LibraryIssue(
        school_id=g.school_id,
        book_id=data['book_id'],
        copy_id=data.get('copy_id'),
        issued_to=data['issued_to'],
        issued_to_type=data.get('issued_to_type', 'student'),
        issue_date=data.get('issue_date', date.today().isoformat()),
        due_date=data.get('due_date', (date.today() + timedelta(days=14)).isoformat()),
        notes=data.get('notes'),
        issued_by=g.current_user.id
    )
    book.available_copies -= 1
    db.session.add(issue)
    db.session.commit()
    return success_response(issue.to_dict(), 'Book issued', 201)


@library_bp.route('/return/<int:issue_id>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def return_book(issue_id):
    issue = LibraryIssue.query.filter_by(id=issue_id, school_id=g.school_id).first_or_404()
    if issue.status == 'returned':
        return error_response('Already returned')
    issue.return_date = date.today()
    issue.status = 'returned'
    if issue.return_date > issue.due_date:
        overdue_days = (issue.return_date - issue.due_date).days
        issue.fine_amount = overdue_days * 2
        fine = BookFine(
            school_id=g.school_id, issue_id=issue.id,
            student_id=issue.issued_to, fine_type='overdue',
            amount=issue.fine_amount
        )
        db.session.add(fine)
    issue.book.available_copies += 1
    db.session.commit()
    return success_response(issue.to_dict(), 'Book returned')


# ── Reservations ───────────────────────────────────────────
@library_bp.route('/reservations', methods=['GET'])
@school_required
@feature_required('library')
def list_reservations():
    query = BookReservation.query.options(
        joinedload(BookReservation.book)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response(paginate(query))


@library_bp.route('/reservations', methods=['POST'])
@school_required
@feature_required('library')
def create_reservation():
    data = request.get_json()
    res = BookReservation(
        school_id=g.school_id,
        book_id=data['book_id'],
        reserved_by=data['reserved_by'],
        reserved_by_type=data.get('reserved_by_type', 'student'),
        reservation_date=data.get('reservation_date', date.today().isoformat()),
        expiry_date=data.get('expiry_date', (date.today() + timedelta(days=7)).isoformat()),
        notes=data.get('notes')
    )
    db.session.add(res)
    db.session.commit()
    return success_response(res.to_dict(), 'Reservation created', 201)


@library_bp.route('/reservations/<int:rid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_reservation(rid):
    res = BookReservation.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['status', 'notes', 'expiry_date']:
        if k in data:
            setattr(res, k, data[k])
    db.session.commit()
    return success_response(res.to_dict(), 'Reservation updated')


@library_bp.route('/reservations/<int:rid>', methods=['DELETE'])
@role_required('school_admin', 'librarian')
def delete_reservation(rid):
    res = BookReservation.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    db.session.delete(res)
    db.session.commit()
    return success_response(None, 'Reservation deleted')


# ── Fines ──────────────────────────────────────────────────
@library_bp.route('/fines', methods=['GET'])
@school_required
@feature_required('library')
def list_fines():
    query = BookFine.query.options(
        joinedload(BookFine.issue).joinedload(LibraryIssue.book)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response(paginate(query))


@library_bp.route('/fines', methods=['POST'])
@role_required('school_admin', 'librarian')
def create_fine():
    data = request.get_json()
    fine = BookFine(
        school_id=g.school_id,
        issue_id=data['issue_id'],
        student_id=data['student_id'],
        fine_type=data.get('fine_type', 'overdue'),
        amount=data['amount'],
        notes=data.get('notes')
    )
    db.session.add(fine)
    db.session.commit()
    return success_response(fine.to_dict(), 'Fine created', 201)


@library_bp.route('/fines/<int:fid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_fine(fid):
    fine = BookFine.query.filter_by(id=fid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['paid_amount', 'status', 'paid_date', 'notes']:
        if k in data:
            setattr(fine, k, data[k])
    db.session.commit()
    return success_response(fine.to_dict(), 'Fine updated')


# ── E-Resources ───────────────────────────────────────────
@library_bp.route('/ebooks', methods=['GET'])
@school_required
@feature_required('library')
def list_ebooks():
    query = EbookResource.query.filter_by(school_id=g.school_id)
    resource_type = request.args.get('resource_type')
    if resource_type:
        query = query.filter_by(resource_type=resource_type)
    return success_response(paginate(query))


@library_bp.route('/ebooks', methods=['POST'])
@role_required('school_admin', 'librarian')
def create_ebook():
    data = request.get_json()
    eb = EbookResource(
        school_id=g.school_id,
        title=data['title'], author=data.get('author'),
        resource_type=data.get('resource_type', 'ebook'),
        subject=data.get('subject'), url=data.get('url'),
        file_path=data.get('file_path'),
        description=data.get('description'),
        access_level=data.get('access_level', 'all')
    )
    db.session.add(eb)
    db.session.commit()
    return success_response(eb.to_dict(), 'E-Resource added', 201)


@library_bp.route('/ebooks/<int:eid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_ebook(eid):
    eb = EbookResource.query.filter_by(id=eid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['title', 'author', 'resource_type', 'subject', 'url', 'file_path',
              'description', 'access_level', 'is_active']:
        if k in data:
            setattr(eb, k, data[k])
    db.session.commit()
    return success_response(eb.to_dict(), 'E-Resource updated')


@library_bp.route('/ebooks/<int:eid>', methods=['DELETE'])
@role_required('school_admin', 'librarian')
def delete_ebook(eid):
    eb = EbookResource.query.filter_by(id=eid, school_id=g.school_id).first_or_404()
    db.session.delete(eb)
    db.session.commit()
    return success_response(None, 'E-Resource deleted')


# ── Periodicals ────────────────────────────────────────────
@library_bp.route('/periodicals', methods=['GET'])
@school_required
@feature_required('library')
def list_periodicals():
    query = Periodical.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response(paginate(query))


@library_bp.route('/periodicals', methods=['POST'])
@role_required('school_admin', 'librarian')
def create_periodical():
    data = request.get_json()
    p = Periodical(
        school_id=g.school_id,
        title=data['title'],
        periodical_type=data.get('periodical_type', 'magazine'),
        publisher=data.get('publisher'),
        frequency=data.get('frequency', 'monthly'),
        subscription_start=data.get('subscription_start'),
        subscription_end=data.get('subscription_end'),
        subscription_cost=data.get('subscription_cost'),
        notes=data.get('notes')
    )
    db.session.add(p)
    db.session.commit()
    return success_response(p.to_dict(), 'Periodical added', 201)


@library_bp.route('/periodicals/<int:pid>', methods=['PUT'])
@role_required('school_admin', 'librarian')
def update_periodical(pid):
    p = Periodical.query.filter_by(id=pid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['title', 'periodical_type', 'publisher', 'frequency',
              'subscription_start', 'subscription_end', 'subscription_cost', 'status', 'notes']:
        if k in data:
            setattr(p, k, data[k])
    db.session.commit()
    return success_response(p.to_dict(), 'Periodical updated')


@library_bp.route('/periodicals/<int:pid>', methods=['DELETE'])
@role_required('school_admin', 'librarian')
def delete_periodical(pid):
    p = Periodical.query.filter_by(id=pid, school_id=g.school_id).first_or_404()
    db.session.delete(p)
    db.session.commit()
    return success_response(None, 'Periodical deleted')


# ── Reading History ────────────────────────────────────────
@library_bp.route('/reading-history', methods=['GET'])
@school_required
@feature_required('library')
def list_reading_history():
    query = ReadingHistory.query.options(
        joinedload(ReadingHistory.book)
    ).filter_by(school_id=g.school_id)
    student_id = request.args.get('student_id', type=int)
    if student_id:
        query = query.filter_by(student_id=student_id)
    return success_response(paginate(query))


@library_bp.route('/reading-history', methods=['POST'])
@school_required
@feature_required('library')
def create_reading_history():
    data = request.get_json()
    rh = ReadingHistory(
        school_id=g.school_id,
        student_id=data['student_id'],
        book_id=data['book_id'],
        start_date=data.get('start_date', date.today().isoformat()),
        rating=data.get('rating'),
        review=data.get('review'),
        pages_read=data.get('pages_read')
    )
    db.session.add(rh)
    db.session.commit()
    return success_response(rh.to_dict(), 'Reading history added', 201)


@library_bp.route('/reading-history/<int:rid>', methods=['PUT'])
@school_required
@feature_required('library')
def update_reading_history(rid):
    rh = ReadingHistory.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['end_date', 'rating', 'review', 'pages_read', 'status']:
        if k in data:
            setattr(rh, k, data[k])
    db.session.commit()
    return success_response(rh.to_dict(), 'Reading history updated')


@library_bp.route('/reading-history/<int:rid>', methods=['DELETE'])
@school_required
@feature_required('library')
def delete_reading_history(rid):
    rh = ReadingHistory.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    db.session.delete(rh)
    db.session.commit()
    return success_response(None, 'Deleted')


# ── Budget ────────────────────────────────────────────────
@library_bp.route('/budget', methods=['GET'])
@school_required
@feature_required('library')
def list_budget():
    query = LibraryBudget.query.filter_by(school_id=g.school_id)
    year = request.args.get('academic_year')
    if year:
        query = query.filter_by(academic_year=year)
    return success_response(paginate(query))


@library_bp.route('/budget', methods=['POST'])
@role_required('school_admin')
def create_budget():
    data = request.get_json()
    b = LibraryBudget(
        school_id=g.school_id,
        academic_year=data['academic_year'],
        category=data.get('category', 'books'),
        allocated_amount=data['allocated_amount'],
        spent_amount=data.get('spent_amount', 0),
        description=data.get('description'),
        status=data.get('status', 'planned')
    )
    db.session.add(b)
    db.session.commit()
    return success_response(b.to_dict(), 'Budget created', 201)


@library_bp.route('/budget/<int:bid>', methods=['PUT'])
@role_required('school_admin')
def update_budget(bid):
    b = LibraryBudget.query.filter_by(id=bid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['academic_year', 'category', 'allocated_amount', 'spent_amount', 'description', 'status']:
        if k in data:
            setattr(b, k, data[k])
    db.session.commit()
    return success_response(b.to_dict(), 'Budget updated')


@library_bp.route('/budget/<int:bid>', methods=['DELETE'])
@role_required('school_admin')
def delete_budget(bid):
    b = LibraryBudget.query.filter_by(id=bid, school_id=g.school_id).first_or_404()
    db.session.delete(b)
    db.session.commit()
    return success_response(None, 'Budget deleted')


# ── ISBN Lookup (Google Books API) ─────────────────────────
@library_bp.route('/isbn-lookup/<isbn>', methods=['GET'])
@school_required
@feature_required('library')
def isbn_lookup(isbn):
    """Fetch book details from Google Books API by ISBN"""
    isbn = isbn.strip().replace('-', '')
    if not isbn:
        return error_response('ISBN is required')
    try:
        resp = http_requests.get(
            f'https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}',
            timeout=10
        )
        data = resp.json()
        if data.get('totalItems', 0) == 0:
            return error_response('No book found for this ISBN', 404)

        vol = data['items'][0]['volumeInfo']
        identifiers = {i['type']: i['identifier'] for i in vol.get('industryIdentifiers', [])}

        return success_response({
            'title': vol.get('title', ''),
            'author': ', '.join(vol.get('authors', [])),
            'publisher': vol.get('publisher', ''),
            'publication_year': int(vol.get('publishedDate', '')[:4]) if vol.get('publishedDate') else None,
            'pages': vol.get('pageCount'),
            'language': vol.get('language', 'en'),
            'isbn': identifiers.get('ISBN_13', identifiers.get('ISBN_10', isbn)),
            'subject': ', '.join(vol.get('categories', [])),
            'description': vol.get('description', ''),
            'thumbnail': vol.get('imageLinks', {}).get('thumbnail', ''),
        })
    except http_requests.exceptions.Timeout:
        return error_response('Google Books API timeout, try again')
    except Exception as e:
        return error_response(f'ISBN lookup failed: {str(e)}')


# ── Bulk Import Books ─────────────────────────────────────
@library_bp.route('/books/bulk-import', methods=['POST'])
@role_required('school_admin', 'librarian')
def bulk_import_books():
    """Import multiple books at once from JSON array.
    Each item needs at minimum: title. Optional: author, isbn, publisher, etc.
    """
    data = request.get_json()
    books_data = data.get('books', [])
    if not books_data:
        return error_response('No books provided')
    if len(books_data) > 500:
        return error_response('Maximum 500 books per import')

    category_id = data.get('category_id')
    default_condition = data.get('condition', 'new')

    added = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(books_data):
        title = (item.get('title') or '').strip()
        if not title:
            errors.append(f'Row {idx + 1}: Title is empty, skipped')
            skipped += 1
            continue

        # Check duplicate by ISBN if provided
        isbn = (item.get('isbn') or '').strip().replace('-', '')
        if isbn:
            existing = LibraryBook.query.filter_by(school_id=g.school_id, isbn=isbn).first()
            if existing:
                errors.append(f'Row {idx + 1}: ISBN {isbn} already exists ({existing.title}), skipped')
                skipped += 1
                continue

        copies = int(item.get('total_copies', 1) or 1)
        book = LibraryBook(
            school_id=g.school_id,
            category_id=item.get('category_id') or category_id,
            title=title,
            author=(item.get('author') or '').strip(),
            isbn=isbn or None,
            publisher=(item.get('publisher') or '').strip() or None,
            edition=(item.get('edition') or '').strip() or None,
            language=item.get('language', 'English'),
            subject=(item.get('subject') or '').strip() or None,
            publication_year=int(item['publication_year']) if item.get('publication_year') else None,
            pages=int(item['pages']) if item.get('pages') else None,
            total_copies=copies,
            available_copies=copies,
            rack_no=(item.get('rack_no') or '').strip() or None,
            price=float(item['price']) if item.get('price') else None,
            condition=item.get('condition', default_condition)
        )
        db.session.add(book)
        added += 1

    db.session.commit()
    return success_response({
        'added': added,
        'skipped': skipped,
        'errors': errors[:20]
    }, f'{added} books imported, {skipped} skipped')
