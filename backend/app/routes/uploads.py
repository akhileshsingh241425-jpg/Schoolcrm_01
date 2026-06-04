"""File upload endpoint for homework attachments and submissions (3MB limit)."""
import os
import uuid
from flask import Blueprint, request, g, current_app, send_from_directory
from werkzeug.utils import secure_filename
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response

uploads_bp = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'}
MAX_FILE_SIZE = 3 * 1024 * 1024  # 3MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@uploads_bp.route('/upload', methods=['POST'])
@school_required
def upload_file():
    """Upload a file (max 3MB). Returns the file URL."""
    if 'file' not in request.files:
        return error_response('No file provided', 400)

    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected', 400)

    if not allowed_file(file.filename):
        return error_response(f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}', 400)

    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE:
        return error_response('File size exceeds 3MB limit', 413)

    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    
    # Determine subfolder
    category = request.form.get('category', 'homework')  # homework, submission, general
    upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), category)
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, unique_name)
    file.save(filepath)

    # Return URL
    file_url = f"/uploads/{category}/{unique_name}"

    return success_response({
        'file_url': file_url,
        'filename': secure_filename(file.filename),
        'size': size,
    }, 'File uploaded successfully', 201)


@uploads_bp.route('/uploads/<path:filepath>', methods=['GET'])
def serve_upload(filepath):
    """Serve uploaded files."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    directory = os.path.dirname(os.path.join(upload_dir, filepath))
    filename = os.path.basename(filepath)
    return send_from_directory(directory, filename)
