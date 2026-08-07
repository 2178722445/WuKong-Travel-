from models import db
from datetime import datetime, timezone


class Favorite(db.Model):
    __tablename__ = 'favorites'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'location_id', name='uq_user_location'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='favorites')
    location = db.relationship('Location', back_populates='favorites')
