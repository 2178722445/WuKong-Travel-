# 空间数据目录

## 文件说明

```
data/
├── geojson/
│   └── locations.geojson    # 16个取景地 GeoJSON 数据 (EPSG:4326)
└── shapefile/               # Shapefile 格式数据 (待导入)
```

## 坐标参考系

- **EPSG:4326** (WGS 84) — 地理坐标系统 (经纬度)，GeoJSON 默认使用
- **EPSG:3857** (Web Mercator) — 投影坐标系统，Web 地图常用

## GeoJSON 结构

每个 Feature 包含：
- `geometry`: Point 类型 (EPSG:4326)
- `properties`: id, name, city, district, tags, period, ticket

## 坐标转换示例

```python
from pyproj import Transformer

# EPSG:4326 -> EPSG:3857
transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
x, y = transformer.transform(lng, lat)

# EPSG:3857 -> EPSG:4326
transformer = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)
lng, lat = transformer.transform(x, y)
```
