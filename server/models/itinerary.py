import json
from models import db
from datetime import datetime, timezone


class Itinerary(db.Model):
    __tablename__ = 'itineraries'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(200), default='我的行程')
    start_date = db.Column(db.String(20), default='')
    end_date = db.Column(db.String(20), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='itineraries')
    days = db.relationship('ItineraryDay', back_populates='itinerary',
                           cascade='all, delete-orphan', order_by='ItineraryDay.day_number')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'startDate': self.start_date,
            'endDate': self.end_date,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'days': [d.to_dict() for d in self.days],
        }


class ItineraryDay(db.Model):
    __tablename__ = 'itinerary_days'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    itinerary_id = db.Column(db.Integer, db.ForeignKey('itineraries.id', ondelete='CASCADE'), nullable=False)
    day_number = db.Column(db.Integer, nullable=False)
    location_ids = db.Column(db.Text, default='[]')
    note = db.Column(db.Text, default='')

    itinerary = db.relationship('Itinerary', back_populates='days')

    def to_dict(self):
        return {
            'id': self.id,
            'itineraryId': self.itinerary_id,
            'dayNumber': self.day_number,
            'locationIds': json.loads(self.location_ids) if isinstance(self.location_ids, str) else self.location_ids,
            'note': self.note,
        }
