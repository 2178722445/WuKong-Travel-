import json
from models import db
from datetime import datetime, timezone
from geoalchemy2 import Geometry


class Location(db.Model):
    __tablename__ = 'locations'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    city = db.Column(db.String(50), nullable=False, index=True)
    district = db.Column(db.String(50), default='')
    lng = db.Column(db.Float, nullable=False)
    lat = db.Column(db.Float, nullable=False)
    geom = db.Column(Geometry('POINT', srid=4326))
    tags = db.Column(db.Text, default='[]')
    period = db.Column(db.String(100), default='')
    description = db.Column(db.Text, default='')
    ticket = db.Column(db.String(100), default='')
    hours = db.Column(db.String(100), default='')
    best_season = db.Column(db.String(100), default='')
    highlight = db.Column(db.Text, default='')
    images = db.Column(db.Text, default='[]')
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    favorites = db.relationship('Favorite', back_populates='location', cascade='all, delete-orphan')
    reviews = db.relationship('Review', back_populates='location', cascade='all, delete-orphan')

    def to_dict(self, include_favorited=None):
        return {
            'id': self.id,
            'name': self.name,
            'city': self.city,
            'district': self.district,
            'lng': self.lng,
            'lat': self.lat,
            'tags': json.loads(self.tags) if isinstance(self.tags, str) else self.tags,
            'period': self.period,
            'description': self.description,
            'ticket': self.ticket,
            'hours': self.hours,
            'bestSeason': self.best_season,
            'highlight': self.highlight,
            'images': json.loads(self.images) if isinstance(self.images, str) else self.images,
            'viewCount': self.view_count,
            'isFavorited': include_favorited,
        }
