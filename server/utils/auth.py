import functools
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timedelta, timezone


def generate_token(user_id, role):
    payload = {
        'userId': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=current_app.config['JWT_EXPIRATION_HOURS']),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def auth_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return jsonify({'error': '未登录'}), 401
        payload = decode_token(header[7:])
        if payload is None:
            return jsonify({'error': '登录已过期'}), 401
        request.user_id = payload['userId']
        request.user_role = payload['role']
        return f(*args, **kwargs)
    return decorated


def auth_optional(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        if header.startswith('Bearer '):
            payload = decode_token(header[7:])
            if payload:
                request.user_id = payload['userId']
                request.user_role = payload['role']
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @functools.wraps(f)
    @auth_required
    def decorated(*args, **kwargs):
        if getattr(request, 'user_role', None) != 'admin':
            return jsonify({'error': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated
