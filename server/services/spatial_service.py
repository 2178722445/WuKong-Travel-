import geopandas as gpd
import networkx as nx
from shapely.geometry import Point, mapping
from shapely.ops import transform
import pyproj
import math

PROJECTION_WGS84 = 'EPSG:4326'
PROJECTION_WEB_MERCATOR = 'EPSG:3857'

_transformer_to_mercator = pyproj.Transformer.from_crs(
    PROJECTION_WGS84, PROJECTION_WEB_MERCATOR, always_xy=True
)
_transformer_to_wgs84 = pyproj.Transformer.from_crs(
    PROJECTION_WEB_MERCATOR, PROJECTION_WGS84, always_xy=True
)


def create_point_geodataframe(locations):
    records = [
        {
            'id': loc.id,
            'name': loc.name,
            'city': loc.city,
            'lng': loc.lng,
            'lat': loc.lat,
            'geometry': Point(loc.lng, loc.lat),
        }
        for loc in locations
    ]
    return gpd.GeoDataFrame(records, crs=PROJECTION_WGS84)


def build_network(locations):
    G = nx.Graph()
    for i, a in enumerate(locations):
        G.add_node(a.id, lng=a.lng, lat=a.lat, name=a.name)
        for j, b in enumerate(locations):
            if i >= j:
                continue
            dist = haversine_distance(a.lng, a.lat, b.lng, b.lat)
            G.add_edge(a.id, b.id, weight=dist)
    return G


def compute_shortest_path(locations, start_id, end_id):
    G = build_network(locations)
    try:
        path = nx.shortest_path(G, source=start_id, target=end_id, weight='weight')
        total_dist = sum(
            haversine_distance(G.nodes[u]['lng'], G.nodes[u]['lat'],
                               G.nodes[v]['lng'], G.nodes[v]['lat'])
            for u, v in zip(path, path[1:])
        )
        path_info = []
        for nid in path:
            for l in locations:
                if l.id == nid:
                    path_info.append({'id': l.id, 'name': l.name, 'lng': l.lng, 'lat': l.lat})
                    break
        return {
            'path': path_info,
            'distance_m': round(total_dist),
            'distance_km': round(total_dist / 1000, 2),
            'total_locations': len(path),
        }
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None


def haversine_distance(lng1, lat1, lng2, lat2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def buffer_analysis(lng, lat, radius_meters):
    point_wgs84 = Point(lng, lat)
    point_mercator = transform(_transformer_to_mercator.transform, point_wgs84)
    buffer_mercator = point_mercator.buffer(radius_meters)
    buffer_wgs84 = transform(_transformer_to_wgs84.transform, buffer_mercator)
    return {
        'center': {'lng': lng, 'lat': lat},
        'radius_m': radius_meters,
        'radius_km': round(radius_meters / 1000, 2),
        'geometry': mapping(buffer_wgs84),
    }


def find_locations_in_buffer(lng, lat, radius_meters, locations):
    point_wgs84 = Point(lng, lat)
    point_mercator = transform(_transformer_to_mercator.transform, point_wgs84)
    buffer_mercator = point_mercator.buffer(radius_meters)
    buffer_wgs84 = transform(_transformer_to_wgs84.transform, buffer_mercator)
    results = []
    for loc in locations:
        if buffer_wgs84.contains(Point(loc.lng, loc.lat)):
            dist = haversine_distance(lng, lat, loc.lng, loc.lat)
            results.append({
                'id': loc.id, 'name': loc.name, 'lng': loc.lng, 'lat': loc.lat,
                'distance_m': round(dist), 'distance_km': round(dist / 1000, 2),
            })
    results.sort(key=lambda x: x['distance_m'])
    return results


def coordinate_transform(lng, lat, from_epsg, to_epsg):
    t = pyproj.Transformer.from_crs(f'EPSG:{from_epsg}', f'EPSG:{to_epsg}', always_xy=True)
    x, y = t.transform(lng, lat)
    return {'lng': x, 'lat': y, 'from': f'EPSG:{from_epsg}', 'to': f'EPSG:{to_epsg}'}


def spatial_optimization(locations, sample_count=5):
    if len(locations) <= sample_count:
        return [{'id': l.id, 'name': l.name, 'lng': l.lng, 'lat': l.lat} for l in locations]
    G = build_network(locations)
    mst = nx.minimum_spanning_tree(G)
    edges = sorted(mst.edges(data=True), key=lambda e: e[2]['weight'], reverse=True)
    removed = 0
    target = len(locations) - sample_count
    for u, v, _ in edges:
        if removed >= target:
            break
        G_temp = mst.copy()
        G_temp.remove_edge(u, v)
        if nx.is_connected(G_temp):
            mst = G_temp
            removed += 1
    connected = set()
    for u, v in mst.edges():
        connected.add(u); connected.add(v)
    return [{'id': l.id, 'name': l.name, 'lng': l.lng, 'lat': l.lat} for l in locations if l.id in connected]
