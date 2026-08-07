from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from models import db

migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=app.config['CORS_ORIGINS'].split(','), supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)

    from routes.auth import auth_bp
    from routes.locations import locations_bp
    from routes.favorites import favorites_bp
    from routes.reviews import reviews_bp
    from routes.itineraries import itineraries_bp
    from routes.dashboard import dashboard_bp
    from routes.spatial import spatial_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(locations_bp, url_prefix='/api/locations')
    app.register_blueprint(favorites_bp, url_prefix='/api/favorites')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    app.register_blueprint(itineraries_bp, url_prefix='/api/itineraries')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(spatial_bp, url_prefix='/api/spatial')

    @app.route('/api/health')
    def health():
        import time
        return {'status': 'ok', 'uptime': time.time()}

    return app


if __name__ == '__main__':
    import os
    app = create_app()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 3721)), debug=True)
