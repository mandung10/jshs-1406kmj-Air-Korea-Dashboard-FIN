# 데이터 출처:
# 공공데이터포털 - 한국환경공단 에어코리아 대기오염통계 OpenAPI
#
# 이용허락:
# 공공누리 제3유형
# (출처표시 + 변경금지)
import requests
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False
from datetime import datetime

SERVICE_KEY = '34bf4f1e493492be23d65080807667d02f00ecc3e3beb9cf3dd52b285e42d93a'

BASE_URL = 'https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureLIst'

regions = {
    'seoul': '서울',
    'busan': '부산',
    'daegu': '대구',
    'incheon': '인천',
    'gwangju': '광주',
    'daejeon': '대전',
    'ulsan': '울산',
    'sejong': '세종',
    'gyeonggi': '경기',
    'gangwon': '강원',
    'chungbuk': '충북',
    'chungnam': '충남',
    'jeonbuk': '전북',
    'jeonnam': '전남',
    'gyeongbuk': '경북',
    'gyeongnam': '경남',
    'jeju': '제주'
}

pollutants = ['PM10', 'PM25', 'SO2', 'NO2', 'CO', 'O3']

all_data = {}

for pollutant in pollutants:
    params = {
        'serviceKey': SERVICE_KEY,
        'returnType': 'json',
        'numOfRows': '1',
        'pageNo': '1',
        'itemCode': pollutant,
        'dataGubun': 'HOUR',
        'searchCondition': 'MONTH'
    }

    response = requests.get(BASE_URL, params=params)
    data = response.json()

    item = data['response']['body']['items'][0]

    for eng, kor in regions.items():
        if kor not in all_data:
            all_data[kor] = {}

        all_data[kor][pollutant] = item.get(eng, '-')

    all_data['time'] = item.get('dataTime', '-')

# 데이터프레임 생성
rows = []

for region, values in all_data.items():
    if region == 'time':
        continue

    rows.append({
        '지역': region,
        'PM10': values.get('PM10'),
        'PM25': values.get('PM25'),
        'SO2': values.get('SO2'),
        'NO2': values.get('NO2'),
        'CO': values.get('CO'),
        'O3': values.get('O3')
    })


df = pd.DataFrame(rows)

print('\n===== 실시간 대기오염 데이터 =====\n')
print(df)

print(f"\n측정 시각: {all_data['time']}")

# CSV 저장
csv_name = f"airkorea_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
df.to_csv(csv_name, index=False, encoding='utf-8-sig')

print(f"\nCSV 파일 저장 완료: {csv_name}")

# 그래프 출력
plt.figure(figsize=(14, 6))

plt.bar(df['지역'], pd.to_numeric(df['PM10'], errors='coerce'))

plt.title('지역별 PM10 미세먼지 농도')
plt.xlabel('지역')
plt.ylabel('PM10 농도 (㎍/㎥)')

plt.xticks(rotation=45)
plt.tight_layout()

plt.show()
