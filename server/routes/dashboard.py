from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import db, User, Location, Review, Itinerary
from utils.auth import admin_required

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
@admin_required
def stats():
    user_count = db.session.query(func.count(User.id)).scalar()
    location_count = db.session.query(func.count(Location.id)).scalar()
    review_count = db.session.query(func.count(Review.id)).scalar()
    itinerary_count = db.session.query(func.count(Itinerary.id)).scalar()
    top_locations = (
        db.session.query(Location.id, Location.name, Location.city, Location.view_count)
        .order_by(Location.view_count.desc())
        .limit(10)
        .all()
    )
    recent_users = (
        db.session.query(User.id, User.username, User.created_at)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )
    return jsonify({
        'userCount': user_count,
        'locationCount': location_count,
        'reviewCount': review_count,
        'itineraryCount': itinerary_count,
        'topLocations': [
            {'id': r.id, 'name': r.name, 'city': r.city, 'viewCount': r.view_count}
            for r in top_locations
        ],
        'recentUsers': [
            {'id': r.id, 'username': r.username,
             'createdAt': r.created_at.isoformat() if r.created_at else None}
            for r in recent_users
        ],
    })


@dashboard_bp.route('/locations', methods=['GET'])
@admin_required
def manage_locations():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 20, type=int)
    search = request.args.get('search')
    query = Location.query
    if search:
        query = query.filter(
            (Location.name.contains(search)) | (Location.city.contains(search))
        )
    total = query.count()
    items = query.order_by(Location.id).offset((page - 1) * page_size).limit(page_size).all()
    return jsonify({
        'locations': [l.to_dict() for l in items],
        'total': total,
        'page': page,
        'pageSize': page_size,
    })


@dashboard_bp.route('/users', methods=['GET'])
@admin_required
def manage_users():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 20, type=int)
    total = db.session.query(func.count(User.id)).scalar()
    users = User.query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return jsonify({
        'users': [u.to_dict() for u in users],
        'total': total,
        'page': page,
        'pageSize': page_size,
    })


@dashboard_bp.route('/users/<int:id>/role', methods=['PUT'])
@admin_required
def update_user_role(id):
    data = request.get_json() or {}
    role = data.get('role')
    if role not in ('user', 'admin'):
        return jsonify({'error': '无效角色'}), 400
    user = db.session.get(User, id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    user.role = role
    db.session.commit()
    return jsonify({'id': user.id, 'username': user.username, 'role': user.role})


@dashboard_bp.route('/reviews', methods=['GET'])
@admin_required
def manage_reviews():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 20, type=int)
    total = db.session.query(func.count(Review.id)).scalar()
    reviews = (
        db.session.query(Review, User.username, Location.name)
        .join(User, Review.user_id == User.id)
        .join(Location, Review.location_id == Location.id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    result = []
    for review, username, loc_name in reviews:
        item = review.to_dict()
        item['user'] = {'id': review.user_id, 'username': username}
        item['location'] = {'id': review.location_id, 'name': loc_name}
        result.append(item)
    return jsonify({
        'reviews': result,
        'total': total,
        'page': page,
        'pageSize': page_size,
    })
