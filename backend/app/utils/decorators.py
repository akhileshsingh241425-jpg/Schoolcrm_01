from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User
from app.models.school import School, SchoolFeature


def get_current_user():
    """Get current authenticated user from JWT"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user


def school_required(f):
    """Decorator to ensure user belongs to an active school"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        school = School.query.get(user.school_id)
        if not school or not school.is_active:
            return jsonify({'error': 'School is inactive or not found'}), 403
        
        g.current_user = user
        g.school_id = user.school_id
        g.school = school
        
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    """Decorator to check if user has one of the required roles"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.role.name not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            school = School.query.get(user.school_id)
            if not school or not school.is_active:
                return jsonify({'error': 'School is inactive'}), 403
            
            g.current_user = user
            g.school_id = user.school_id
            g.school = school
            
            return f(*args, **kwargs)
        return decorated
    return decorator


def feature_required(feature_name):
    """Decorator to check if a feature is enabled for the school"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            school_id = g.get('school_id')
            if not school_id:
                return jsonify({'error': 'School context not found'}), 400
            
            feature = SchoolFeature.query.filter_by(
                school_id=school_id,
                feature_name=feature_name,
                is_enabled=True
            ).first()
            
            if not feature:
                return jsonify({'error': f'Feature "{feature_name}" is not enabled for your school'}), 403
            
            return f(*args, **kwargs)
        return decorated
    return decorator


def super_admin_required(f):
    """Decorator for super admin only routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user or user.role.name != 'super_admin':
            return jsonify({'error': 'Super admin access required'}), 403
        
        g.current_user = user
        g.school_id = user.school_id
        
        return f(*args, **kwargs)
    return decorated
