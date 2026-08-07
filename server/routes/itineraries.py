import json
from flask import Blueprint, request, jsonify
from models import db, Itinerary, ItineraryDay
from utils.auth import auth_required

itineraries_bp = Blueprint('itineraries', __name__)


@itineraries_bp.route('/', methods=['GET'])
@auth_required
def list_itineraries():
    items = (
        Itinerary.query
        .filter_by(user_id=request.user_id)
        .order_by(Itinerary.updated_at.desc())
        .all()
    )
    return jsonify([i.to_dict() for i in items])


@itineraries_bp.route('/<int:id>', methods=['GET'])
@auth_required
def get_itinerary(id):
    item = Itinerary.query.filter_by(id=id, user_id=request.user_id).first()
    if not item:
        return jsonify({'error': '行程不存在'}), 404
    return jsonify(item.to_dict())


@itineraries_bp.route('/', methods=['POST'])
@auth_required
def create_itinerary():
    data = request.get_json() or {}
    item = Itinerary(
        user_id=request.user_id,
        name=data.get('name', '我的行程'),
        start_date=data.get('startDate', ''),
        end_date=data.get('endDate', ''),
    )
    for day_data in data.get('days', []):
        day = ItineraryDay(
            day_number=day_data.get('dayNumber', 1),
            location_ids=json.dumps(day_data.get('locationIds', []), ensure_ascii=False),
            note=day_data.get('note', ''),
        )
        item.days.append(day)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@itineraries_bp.route('/<int:id>', methods=['PUT'])
@auth_required
def update_itinerary(id):
    item = Itinerary.query.filter_by(id=id, user_id=request.user_id).first()
    if not item:
        return jsonify({'error': '行程不存在'}), 404
    data = request.get_json() or {}
    if 'name' in data:
        item.name = data['name']
    if 'startDate' in data:
        item.start_date = data['startDate']
    if 'endDate' in data:
        item.end_date = data['endDate']
    if 'days' in data:
        ItineraryDay.query.filter_by(itinerary_id=id).delete()
        for day_data in data['days']:
            day = ItineraryDay(
                itinerary_id=id,
                day_number=day_data.get('dayNumber', 1),
                location_ids=json.dumps(day_data.get('locationIds', []), ensure_ascii=False),
                note=day_data.get('note', ''),
            )
            db.session.add(day)
    db.session.commit()
    return jsonify(item.to_dict())


@itineraries_bp.route('/<int:id>', methods=['DELETE'])
@auth_required
def delete_itinerary(id):
    item = Itinerary.query.filter_by(id=id, user_id=request.user_id).first()
    if not item:
        return jsonify({'error': '行程不存在'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})
