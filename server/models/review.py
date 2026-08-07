import json
from models import db
from datetime import datetime, timezone


class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, default='')
    images = db.Column(db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='reviews')
    location = db.relationship('Location', back_populates='reviews')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'locationId': self.location_id,
            'rating': self.rating,
            'content': self.content,
            'images': json.loads(self.images) if isinstance(self.images, str) else self.images,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'user': {'id': self.user.id, 'username': self.user.username, 'avatar': self.user.avatar} if self.user else None,
        }
