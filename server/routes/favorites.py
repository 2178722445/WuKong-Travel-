from flask import Blueprint, request, jsonify
from models import db, Favorite, Location
from utils.auth import auth_required

favorites_bp = Blueprint('favorites', __name__)


@favorites_bp.route('/', methods=['GET'])
@auth_required
def list_favorites():
    favs = (
        db.session.query(Favorite, Location)
        .join(Location, Favorite.location_id == Location.id)
        .filter(Favorite.user_id == request.user_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    result = []
    for fav, loc in favs:
        item = fav.__dict__.copy()
        item.pop('_sa_instance_state', None)
        item['location'] = loc.to_dict()
        result.append(item)
    return jsonify(result)


@favorites_bp.route('/<int:location_id>', methods=['POST'])
@auth_required
def toggle_favorite(location_id):
    existing = Favorite.query.filter_by(user_id=request.user_id, location_id=location_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'favorited': False})
    fav = Favorite(user_id=request.user_id, location_id=location_id)
    db.session.add(fav)
    db.session.commit()
    return jsonify({'favorited': True})
