import json
from flask import Blueprint, request, jsonify
from models import db, Review
from utils.auth import auth_required

reviews_bp = Blueprint('reviews', __name__)


@reviews_bp.route('/location/<int:location_id>', methods=['GET'])
def list_reviews(location_id):
    reviews = Review.query.filter_by(location_id=location_id).order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews])


@reviews_bp.route('/<int:location_id>', methods=['POST'])
@auth_required
def submit_review(location_id):
    data = request.get_json() or {}
    rating = data.get('rating', 0)
    content = data.get('content', '')
    images = data.get('images', [])
    if not 1 <= rating <= 5:
        return jsonify({'error': '评分需在1-5之间'}), 400
    if len(content) > 2000:
        return jsonify({'error': '内容不能超过2000字'}), 400
    existing = Review.query.filter_by(user_id=request.user_id, location_id=location_id).first()
    if existing:
        existing.rating = rating
        existing.content = content
        existing.images = json.dumps(images, ensure_ascii=False)
        db.session.commit()
        return jsonify(existing.to_dict())
    review = Review(
        user_id=request.user_id,
        location_id=location_id,
        rating=rating,
        content=content,
        images=json.dumps(images, ensure_ascii=False),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201


@reviews_bp.route('/<int:id>', methods=['DELETE'])
@auth_required
def delete_review(id):
    review = db.session.get(Review, id)
    if not review:
        return jsonify({'error': '评价不存在'}), 404
    if review.user_id != request.user_id and getattr(request, 'user_role', None) != 'admin':
        return jsonify({'error': '无权限'}), 403
    db.session.delete(review)
    db.session.commit()
    return jsonify({'success': True})
