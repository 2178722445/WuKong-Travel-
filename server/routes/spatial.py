from flask import Blueprint, request, jsonify
from models import Location
from services.spatial_service import (
    create_point_geodataframe,
    compute_shortest_path,
    buffer_analysis,
    find_locations_in_buffer,
    coordinate_transform,
    spatial_optimization,
    haversine_distance,
)

spatial_bp = Blueprint('spatial', __name__)


@spatial_bp.route('/geojson/locations', methods=['GET'])
def locations_geojson():
    locs = Location.query.order_by(Location.id).all()
    features = []
    for loc in locs:
        import json
        features.append({
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': [loc.lng, loc.lat]},
            'properties': {
                'id': loc.id,
                'name': loc.name,
                'city': loc.city,
                'district': loc.district,
                'tags': json.loads(loc.tags) if isinstance(loc.tags, str) else loc.tags,
                'ticket': loc.ticket,
                'viewCount': loc.view_count,
            },
        })
    return jsonify({'type': 'FeatureCollection', 'features': features})


@spatial_bp.route('/shortest-path', methods=['GET'])
def shortest_path():
    locs = Location.query.order_by(Location.id).all()
    start_id = request.args.get('start', type=int)
    end_id = request.args.get('end', type=int)
    if not start_id or not end_id:
        return jsonify({'error': '请指定 start 和 end 参数（location id）'}), 400
    result = compute_shortest_path(locs, start_id, end_id)
    if not result:
        return jsonify({'error': '无法计算路径'}), 404
    return jsonify(result)


@spatial_bp.route('/buffer', methods=['GET'])
def buffer():
    lng = request.args.get('lng', type=float)
    lat = request.args.get('lat', type=float)
    radius = request.args.get('radius', 5000, type=int)
    if lng is None or lat is None:
        return jsonify({'error': '请指定 lng 和 lat 参数'}), 400
    locs = Location.query.order_by(Location.id).all()
    buf = buffer_analysis(lng, lat, radius)
    within = find_locations_in_buffer(lng, lat, radius, locs)
    buf['locations_in_buffer'] = within
    return jsonify(buf)


@spatial_bp.route('/transform', methods=['GET'])
def transform_coord():
    lng = request.args.get('lng', type=float)
    lat = request.args.get('lat', type=float)
    from_epsg = request.args.get('from', 4326, type=int)
    to_epsg = request.args.get('to', 3857, type=int)
    if lng is None or lat is None:
        return jsonify({'error': '请指定 lng 和 lat 参数'}), 400
    return jsonify(coordinate_transform(lng, lat, from_epsg, to_epsg))


@spatial_bp.route('/distance', methods=['GET'])
def distance():
    lng1 = request.args.get('lng1', type=float)
    lat1 = request.args.get('lat1', type=float)
    lng2 = request.args.get('lng2', type=float)
    lat2 = request.args.get('lat2', type=float)
    if None in (lng1, lat1, lng2, lat2):
        return jsonify({'error': '请指定 lng1, lat1, lng2, lat2 参数'}), 400
    d = haversine_distance(lng1, lat1, lng2, lat2)
    return jsonify({'distance_m': round(d), 'distance_km': round(d / 1000, 2)})


@spatial_bp.route('/optimize', methods=['GET'])
def optimize():
    sample_count = request.args.get('count', 5, type=int)
    locs = Location.query.order_by(Location.id).all()
    result = spatial_optimization(locs, sample_count)
    return jsonify({'selected': result, 'total_locations': len(locs)})
