from flask import Blueprint, request, jsonify
import bcrypt
from models import db, User
from utils.auth import generate_token, auth_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not username or len(username) < 2 or len(username) > 20:
        return jsonify({'error': '用户名需2-20个字符'}), 400
    if not email or '@' not in email:
        return jsonify({'error': '邮箱格式不正确'}), 400
    if not password or len(password) < 6 or len(password) > 50:
        return jsonify({'error': '密码需6-50个字符'}), 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': '用户名或邮箱已存在'}), 400
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(username=username, email=email, password=hashed)
    db.session.add(user)
    db.session.commit()
    token = generate_token(user.id, user.role)
    return jsonify({'token': token, 'user': user.to_dict()})


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_id = data.get('username', '').strip()
    password = data.get('password', '')
    if not login_id or not password:
        return jsonify({'error': '请输入用户名和密码'}), 400
    user = User.query.filter((User.username == login_id) | (User.email == login_id)).first()
    if not user:
        return jsonify({'error': '用户不存在'}), 400
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'error': '密码错误'}), 400
    token = generate_token(user.id, user.role)
    return jsonify({'token': token, 'user': user.to_dict()})


@auth_bp.route('/me', methods=['GET'])
@auth_required
def me():
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(user.to_dict())


@auth_bp.route('/profile', methods=['PUT'])
@auth_required
def update_profile():
    data = request.get_json() or {}
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    if 'avatar' in data:
        user.avatar = data['avatar']
    db.session.commit()
    return jsonify(user.to_dict())
