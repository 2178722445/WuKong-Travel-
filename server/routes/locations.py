import json
from flask import Blueprint, request, jsonify
from models import db, Location, Favorite, Review, User
from utils.auth import auth_optional, admin_required
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point

locations_bp = Blueprint('locations', __name__)


def _get_favorite_ids(user_id):
    if not user_id:
        return set()
    rows = db.session.query(Favorite.location_id).filter(Favorite.user_id == user_id).all()
    return {r[0] for r in rows}


@locations_bp.route('/', methods=['GET'])
@auth_optional
def list_locations():
    user_id = getattr(request, 'user_id', None)
    city = request.args.get('city')
    tag = request.args.get('tag')
    search = request.args.get('search')
    query = Location.query
    if city:
        query = query.filter(Location.city.contains(city))
    if tag:
        query = query.filter(Location.tags.contains(tag))
    if search:
        pattern = f'%{search}%'
        from sqlalchemy import or_
        query = query.filter(or_(
            Location.name.contains(search),
            Location.description.contains(search),
            Location.city.contains(search),
        ))
    locations = query.order_by(Location.id).all()
    fav_ids = _get_favorite_ids(user_id)
    return jsonify({
        'locations': [loc.to_dict(include_favorited=loc.id in fav_ids) for loc in locations],
        'favorites': list(fav_ids),
    })


@locations_bp.route('/<int:id>', methods=['GET'])
@auth_optional
def get_location(id):
    loc = db.session.get(Location, id)
    if not loc:
        return jsonify({'error': '取景地不存在'}), 404
    loc.view_count += 1
    db.session.commit()
    user_id = getattr(request, 'user_id', None)
    is_fav = False
    if user_id:
        is_fav = Favorite.query.filter_by(user_id=user_id, location_id=id).first() is not None
    reviews = Review.query.filter_by(location_id=id).order_by(Review.created_at.desc()).all()
    result = loc.to_dict(include_favorited=is_fav)
    result['reviews'] = [r.to_dict() for r in reviews]
    return jsonify(result)


@locations_bp.route('/', methods=['POST'])
@admin_required
def create_location():
    data = request.get_json() or {}
    required = ['name', 'city', 'lng', 'lat']
    for field in required:
        if field not in data:
            return jsonify({'error': f'缺少必填字段: {field}'}), 400
    loc = Location(
        name=data['name'],
        city=data['city'],
        district=data.get('district', ''),
        lng=data['lng'],
        lat=data['lat'],
        tags=json.dumps(data.get('tags', []), ensure_ascii=False),
        period=data.get('period', ''),
        description=data.get('description', ''),
        ticket=data.get('ticket', ''),
        hours=data.get('hours', ''),
        best_season=data.get('bestSeason', ''),
        highlight=data.get('highlight', ''),
        images=json.dumps(data.get('images', []), ensure_ascii=False),
    )
    loc.geom = from_shape(Point(data['lng'], data['lat']), srid=4326)
    db.session.add(loc)
    db.session.commit()
    return jsonify(loc.to_dict()), 201


@locations_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_location(id):
    loc = db.session.get(Location, id)
    if not loc:
        return jsonify({'error': '取景地不存在'}), 404
    data = request.get_json() or {}
    for field in ['name', 'city', 'district', 'period', 'description', 'ticket', 'hours', 'best_season', 'highlight']:
        if field in data:
            setattr(loc, field, data[field])
    if 'lng' in data:
        loc.lng = data['lng']
    if 'lat' in data:
        loc.lat = data['lat']
    if 'lng' in data or 'lat' in data:
        loc.geom = from_shape(Point(loc.lng, loc.lat), srid=4326)
    if 'tags' in data:
        loc.tags = json.dumps(data['tags'], ensure_ascii=False)
    if 'images' in data:
        loc.images = json.dumps(data['images'], ensure_ascii=False)
    db.session.commit()
    return jsonify(loc.to_dict())


@locations_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_location(id):
    loc = db.session.get(Location, id)
    if not loc:
        return jsonify({'error': '取景地不存在'}), 404
    db.session.delete(loc)
    db.session.commit()
    return jsonify({'success': True})
