from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from models.user import User
from models.location import Location
from models.favorite import Favorite
from models.review import Review
from models.itinerary import Itinerary, ItineraryDay
