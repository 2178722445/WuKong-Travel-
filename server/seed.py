import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db, User, Location
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
import bcrypt

LOCATIONS = [
    {'id': 1, 'name': '云冈石窟', 'city': '大同市', 'district': '云冈区', 'lng': 113.1300, 'lat': 40.1100,
     'tags': ['世界文化遗产', '5A景区', '石窟艺术'], 'period': '北魏 (公元460年)',
     'description': '云冈石窟是中国四大石窟之一，开凿于北魏和平年间，历时约60年完成。现存主要洞窟45个，附属洞窟209个，造像最高17米，最小2厘米，大小造像59000余尊。石窟依山开凿，东西绵延约1公里，是中国石窟艺术中第一个全由皇家经营的大型石窟群。',
     'ticket': '旺季120元 / 淡季100元', 'hours': '08:30-17:30 (4月-10月) / 08:30-17:00 (11月-3月)', 'best_season': '5月-10月',
     'highlight': '第20窟露天大佛、第5窟17米释迦坐像、昙曜五窟'},
    {'id': 2, 'name': '悬空寺', 'city': '大同市', 'district': '浑源县', 'lng': 113.7140, 'lat': 39.6590,
     'tags': ['悬空建筑', '儒释道三教', '5A景区'], 'period': '北魏太和十五年 (公元491年)',
     'description': '悬空寺始建于北魏，距今已有1500余年历史，是中国仅存的佛、道、儒三教合一的独特寺庙。全寺为木质框架式结构，依靠榫接结构嵌入崖壁而不倒，被誉为"悬挂在崖壁上的奇迹"。',
     'ticket': '全票115元 / 登临费100元', 'hours': '08:00-18:00 (夏季) / 08:30-17:30 (冬季)', 'best_season': '4月-10月',
     'highlight': '三教殿、南楼北楼、飞檐斗拱、悬崖栈道'},
    {'id': 3, 'name': '应县木塔', 'city': '朔州市', 'district': '应县', 'lng': 113.1910, 'lat': 39.5650,
     'tags': ['世界最高木塔', '辽代建筑', '国保'], 'period': '辽清宁二年 (公元1056年)',
     'description': '应县木塔全称佛宫寺释迦塔，塔高67.31米，纯木结构、无钉无铆，历经千年风雨、地震、战火而屹立不倒，与意大利比萨斜塔、巴黎埃菲尔铁塔并称"世界三大奇塔"。',
     'ticket': '60元', 'hours': '08:00-18:00', 'best_season': '全年皆宜，秋季最佳',
     'highlight': '辽代彩塑佛像、斗拱结构、历代匾额'},
    {'id': 4, 'name': '五台山', 'city': '忻州市', 'district': '五台县', 'lng': 113.5890, 'lat': 39.0080,
     'tags': ['世界文化遗产', '5A景区', '佛教圣地'], 'period': '东汉永平年间 (公元68年)',
     'description': '五台山是中国四大佛教名山之首，文殊菩萨的道场。现存寺庙47座，其中佛光寺和南禅寺是中国现存最早的木结构建筑。',
     'ticket': '进山费135元 / 各寺庙另收', 'hours': '全天开放', 'best_season': '6月-9月',
     'highlight': '菩萨顶、显通寺、塔院寺、黛螺顶、五爷庙'},
    {'id': 5, 'name': '佛光寺', 'city': '忻州市', 'district': '五台县', 'lng': 113.1430, 'lat': 38.8780,
     'tags': ['唐代木构', '梁思成发现', '国保'], 'period': '唐大中十一年 (公元857年)',
     'description': '佛光寺东大殿是中国现存规模最大、保存最完整的唐代木构建筑，被梁思成称为"中国第一国宝"。',
     'ticket': '40元', 'hours': '08:00-18:00', 'best_season': '5月-10月',
     'highlight': '东大殿唐代木构、唐代彩塑、唐代壁画、北魏祖师塔'},
    {'id': 6, 'name': '南禅寺', 'city': '忻州市', 'district': '五台县', 'lng': 113.1100, 'lat': 38.7660,
     'tags': ['唐代木构', '最古老木构', '国保'], 'period': '唐建中三年 (公元782年)',
     'description': '南禅寺大佛殿是中国现存最古老的木结构建筑，比佛光寺东大殿还要早75年。殿内保存有17尊唐代彩塑。',
     'ticket': '20元', 'hours': '08:00-18:00', 'best_season': '5月-10月',
     'highlight': '唐代木构大殿、17尊唐代彩塑、唐代石塔'},
    {'id': 7, 'name': '华严寺', 'city': '大同市', 'district': '平城区', 'lng': 113.2900, 'lat': 40.0910,
     'tags': ['辽代建筑', '皇家寺院', '国保'], 'period': '辽重熙七年 (公元1038年)',
     'description': '华严寺是辽代皇家寺院，大雄宝殿面阔九间、进深五间，是我国现存最大的辽金佛殿。薄伽教藏殿内的合掌露齿菩萨被称为"东方维纳斯"。',
     'ticket': '50元', 'hours': '08:30-17:30', 'best_season': '全年皆宜',
     'highlight': '大雄宝殿、薄伽教藏殿、合掌露齿菩萨、华严宝塔'},
    {'id': 8, 'name': '善化寺', 'city': '大同市', 'district': '平城区', 'lng': 113.2970, 'lat': 40.0860,
     'tags': ['辽金建筑', '国保'], 'period': '唐开元年间 / 金代重修',
     'description': '善化寺始建于唐开元年间，金代重修。大雄宝殿内的五方佛和二十四诸天彩塑是金代雕塑精品。',
     'ticket': '免费', 'hours': '08:00-18:00', 'best_season': '全年皆宜',
     'highlight': '大雄宝殿五方佛、二十四诸天彩塑、三圣殿斜拱、普贤阁'},
    {'id': 9, 'name': '晋祠', 'city': '太原市', 'district': '晋源区', 'lng': 112.4370, 'lat': 37.7080,
     'tags': ['宋代建筑', '4A景区', '国保'], 'period': '北宋天圣年间 (公元1023年)',
     'description': '晋祠是中国现存最早的古典祠堂园林建筑群。圣母殿前鱼沼飞梁是我国现存最早的十字形古桥。难老泉、侍女像、周柏被誉为"晋祠三绝"。',
     'ticket': '旺季80元 / 淡季65元', 'hours': '08:00-18:00 (4月-10月) / 08:30-17:00 (11月-3月)', 'best_season': '4月-10月',
     'highlight': '圣母殿、鱼沼飞梁、难老泉、宋代侍女彩塑、周柏'},
    {'id': 10, 'name': '平遥古城', 'city': '晋中市', 'district': '平遥县', 'lng': 112.1960, 'lat': 37.2010,
     'tags': ['世界文化遗产', '5A景区', '古城'], 'period': '西周 / 明代扩建',
     'description': '平遥古城是中国保存最为完整的四座古城之一，也是中国仅有的以整座古城申报世界文化遗产的古城。',
     'ticket': '通票125元 (含22个景点)', 'hours': '全天开放 / 景点08:00-18:00', 'best_season': '全年皆宜，春秋最佳',
     'highlight': '日升昌票号、平遥县衙、文庙、古城墙、明清一条街'},
    {'id': 11, 'name': '双林寺', 'city': '晋中市', 'district': '平遥县', 'lng': 112.1810, 'lat': 37.1760,
     'tags': ['明代彩塑', '国保'], 'period': '北齐 / 明代重修',
     'description': '双林寺保存有元明两代彩塑2052尊，被誉为"东方彩塑艺术宝库"。其中韦驮像被誉为"全国韦驮之冠"。',
     'ticket': '35元', 'hours': '08:00-18:00', 'best_season': '全年皆宜',
     'highlight': '韦驮像、千手观音、自在观音、十八罗汉彩塑'},
    {'id': 12, 'name': '镇国寺', 'city': '晋中市', 'district': '平遥县', 'lng': 112.2440, 'lat': 37.2820,
     'tags': ['五代建筑', '国保'], 'period': '五代北汉天会七年 (公元963年)',
     'description': '镇国寺万佛殿是中国现存最古老的木结构建筑之一，殿内保存有全国唯一的五代时期彩塑作品。',
     'ticket': '25元', 'hours': '08:00-18:00', 'best_season': '全年皆宜',
     'highlight': '万佛殿五代木构、五代彩塑、明代壁画、元代铁钟'},
    {'id': 13, 'name': '广胜寺', 'city': '临汾市', 'district': '洪洞县', 'lng': 111.7880, 'lat': 36.3030,
     'tags': ['元代壁画', '飞虹塔', '国保'], 'period': '东汉 / 元代重建',
     'description': '广胜寺以飞虹塔和水神庙元代壁画闻名。飞虹塔高47米，是中国现存最完整、最精美的琉璃塔。',
     'ticket': '55元', 'hours': '08:00-18:00', 'best_season': '5月-10月',
     'highlight': '飞虹琉璃塔、水神庙元代壁画、赵城金藏、元代戏剧壁画'},
    {'id': 14, 'name': '小西天(千佛庵)', 'city': '临汾市', 'district': '隰县', 'lng': 110.9400, 'lat': 36.6900,
     'tags': ['悬塑艺术', '明代', '国保'], 'period': '明崇祯七年 (公元1634年)',
     'description': '小西天以精美绝伦的悬塑艺术闻名于世。大雄宝殿内满布悬塑，被誉为"中国悬塑艺术博物馆"。',
     'ticket': '35元', 'hours': '08:00-18:00', 'best_season': '5月-10月',
     'highlight': '大雄宝殿悬塑、千佛雕塑、明清彩绘、凤凰山'},
    {'id': 15, 'name': '永乐宫', 'city': '运城市', 'district': '芮城县', 'lng': 110.8760, 'lat': 34.7240,
     'tags': ['元代壁画', '道教', '国保'], 'period': '元定宗贵由二年 (公元1247年)',
     'description': '永乐宫是中国现存规模最大、保存最完整的元代道教宫观。三清殿《朝元图》描绘了290位神祇，是世界绘画史上的杰作。',
     'ticket': '60元', 'hours': '08:00-18:00 (4月-10月) / 09:00-17:00 (11月-3月)', 'best_season': '4月-10月',
     'highlight': '《朝元图》壁画、三清殿、纯阳殿、重阳殿元代壁画'},
    {'id': 16, 'name': '观音堂', 'city': '长治市', 'district': '潞州区', 'lng': 113.1130, 'lat': 36.1950,
     'tags': ['明代悬塑', '国保'], 'period': '明万历十年 (公元1582年)',
     'description': '观音堂殿内满布明代悬塑，大小造像五百余尊，儒释道三教人物共聚一堂，是明代悬塑艺术的杰出代表。',
     'ticket': '10元', 'hours': '08:30-17:30', 'best_season': '全年皆宜',
     'highlight': '明代悬塑群像、三教合一造像、观音殿彩塑'},
]


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@wukong.com',
                password=bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='admin',
            )
            db.session.add(admin)
            db.session.commit()
            print('[Seed] Admin account created: admin / admin123')

        for loc_data in LOCATIONS:
            existing = db.session.get(Location, loc_data['id'])
            if existing:
                existing.name = loc_data['name']
                existing.tags = json.dumps(loc_data['tags'], ensure_ascii=False)
                existing.geom = from_shape(Point(loc_data['lng'], loc_data['lat']), srid=4326)
            else:
                loc = Location(
                    id=loc_data['id'],
                    name=loc_data['name'],
                    city=loc_data['city'],
                    district=loc_data['district'],
                    lng=loc_data['lng'],
                    lat=loc_data['lat'],
                    tags=json.dumps(loc_data['tags'], ensure_ascii=False),
                    period=loc_data['period'],
                    description=loc_data['description'],
                    ticket=loc_data['ticket'],
                    hours=loc_data['hours'],
                    best_season=loc_data['best_season'],
                    highlight=loc_data['highlight'],
                    images='[]',
                )
                loc.geom = from_shape(Point(loc_data['lng'], loc_data['lat']), srid=4326)
                db.session.add(loc)
        db.session.commit()
        print('[Seed] 16 locations seeded successfully!')


if __name__ == '__main__':
    seed()
