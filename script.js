const SERVICE_KEY='34bf4f1e493492be23d65080807667d02f00ecc3e3beb9cf3dd52b285e42d93a';

const regionMap={
seoul:'서울',
busan:'부산',
daegu:'대구',
incheon:'인천',
gwangju:'광주',
daejeon:'대전',
ulsan:'울산',
sejong:'세종',
gyeonggi:'경기',
gangwon:'강원',
chungbuk:'충북',
chungnam:'충남',
jeonbuk:'전북',
jeonnam:'전남',
gyeongbuk:'경북',
gyeongnam:'경남',
jeju:'제주'
};

const units={
pm10:'㎍/㎥',
pm25:'㎍/㎥',
so2:'ppm',
no2:'ppm',
co:'ppm',
o3:'ppm'
};

const labelsMap={
pm10:'미세먼지(PM10)',
pm25:'초미세먼지(PM2.5)',
so2:'아황산가스(SO₂)',
no2:'이산화질소(NO₂)',
co:'일산화탄소(CO)',
o3:'오존(O₃)'
};

const coords={
서울:[37.5665,126.9780],
부산:[35.1796,129.0756],
대구:[35.8714,128.6014],
인천:[37.4563,126.7052],
광주:[35.1595,126.8526],
대전:[36.3504,127.3845],
울산:[35.5384,129.3114],
세종:[36.4800,127.2890],
경기:[37.4138,127.5183],
강원:[37.8228,128.1555],
충북:[36.6357,127.4917],
충남:[36.5184,126.8000],
전북:[35.7175,127.1530],
전남:[34.8679,126.9910],
경북:[36.4919,128.8889],
경남:[35.4606,128.2132],
제주:[33.4996,126.5312]
};

let allData={};
let barChart,doughnutChart;

const map=L.map('map').setView([36.3,127.8],7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'OpenStreetMap'
}).addTo(map);

function setTheme(mode){
if(mode==='light'){
document.body.classList.add('light');
}else{
document.body.classList.remove('light');
}
renderCharts(allData);
}

function formatTime(t){

if(!t) return '-';

const time=t.split(' ')[1];

if(!time) return t;

let [h,m]=time.split(':').map(Number);

const ap=h>=12?'오후':'오전';

h=h%12||12;

return `${ap} ${h}시 ${String(m).padStart(2,'0')}분`;
}

async function fetchItem(code){

const url=`https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureLIst?serviceKey=${SERVICE_KEY}&returnType=json&numOfRows=30&pageNo=1&itemCode=${code}&dataGubun=HOUR&searchCondition=MONTH`;

const res=await fetch(url);

const json=await res.json();

if(!json.response || !json.response.body){

throw new Error('API 응답 오류');

}

return json.response.body.items;
}

async function loadData(){

try{

const idx=parseInt(document.getElementById('timeSelect').value);

const [pm10,pm25,so2,no2,co,o3]=await Promise.all([
fetchItem('PM10'),
fetchItem('PM25'),
fetchItem('SO2'),
fetchItem('NO2'),
fetchItem('CO'),
fetchItem('O3')
]);

const p10=pm10[idx]||pm10[0];
const p25=pm25[idx]||pm25[0];
const s2=so2[idx]||so2[0];
const n2=no2[idx]||no2[0];
const co2=co[idx]||co[0];
const o33=o3[idx]||o3[0];

allData={};

Object.keys(regionMap).forEach(key=>{

const region=regionMap[key];

allData[region]={
pm10:p10[key],
pm25:p25[key],
so2:s2[key],
no2:n2[key],
co:co2[key],
o3:o33[key],
time:p10.dataTime
};

});

fillCompare();

render(allData);

}catch(e){

console.error(e);

alert('현재 API 데이터를 불러올 수 없습니다.');

}

}

function fillCompare(){

const c1=document.getElementById('compare1');
const c2=document.getElementById('compare2');

c1.innerHTML='';
c2.innerHTML='';

Object.keys(allData).forEach(r=>{

c1.innerHTML+=`<option>${r}</option>`;
c2.innerHTML+=`<option>${r}</option>`;

});
}

function render(data){

const result=document.getElementById('result');

result.innerHTML='';

map.eachLayer(layer=>{

if(layer instanceof L.Marker){
map.removeLayer(layer);
}

});

Object.entries(data).forEach(([region,val])=>{

const div=document.createElement('div');

div.className='region-card';

div.innerHTML=`

<h3>${region}</h3>

<p><b>PM10 미세먼지 농도</b> : ${val.pm10} ㎍/㎥</p>

<p><b>PM2.5 초미세먼지 농도</b> : ${val.pm25} ㎍/㎥</p>

<p><b>SO₂ 아황산가스 농도</b> : ${val.so2} ppm</p>

<p><b>NO₂ 이산화질소 농도</b> : ${val.no2} ppm</p>

<p><b>CO 일산화탄소 농도</b> : ${val.co} ppm</p>

<p><b>O₃ 오존 농도</b> : ${val.o3} ppm</p>

<p><b>측정 시각</b> : ${formatTime(val.time)}</p>

`;

result.appendChild(div);

if(coords[region]){

L.marker(coords[region]).addTo(map)

.bindPopup(`${region}<br>${val.pm10}㎍/㎥`);

}

});

renderCharts(data);
}

function renderCharts(data){

const metric=document.getElementById('pollutantSelect').value;

const labels=Object.keys(data);

const values=Object.values(data).map(v=>Number(v[metric]));

const textColor=getComputedStyle(document.body)
.getPropertyValue('--text');

if(barChart) barChart.destroy();

if(doughnutChart) doughnutChart.destroy();

barChart=new Chart(document.getElementById('barChart'),{

type:'bar',

data:{
labels:labels,

datasets:[{
label:`${labelsMap[metric]} (${units[metric]})`,
data:values,
borderRadius:12,
borderSkipped:false,
hoverBorderWidth:2,
hoverBorderRadius:14
}]
},

options:{
responsive:true,

animation:{
duration:1200,
easing:'easeInOutQuart'
},

plugins:{
legend:{
labels:{
color:textColor,
font:{
size:14
}
}
},

tooltip:{
enabled:true,
padding:12
}
},

scales:{

x:{
ticks:{
color:textColor,
font:{
size:13
}
},

grid:{
display:false
}
},

y:{
ticks:{
color:textColor,
font:{
size:13
}
},

grid:{
color:'rgba(255,255,255,0.08)'
}
}

}
}

});

doughnutChart=new Chart(document.getElementById('doughnutChart'),{

type:'doughnut',

data:{
labels:labels,

datasets:[{
data:values,
hoverOffset:24
}]
},

options:{
responsive:true,

animation:{
animateRotate:true,
animateScale:true,
duration:1500,
easing:'easeInOutExpo'
},

plugins:{
legend:{
labels:{
color:textColor,
font:{
size:14
}
}
},

tooltip:{
enabled:true,
padding:12
}
}
}

});

}

function compareRegions(){

const r1=document.getElementById('compare1').value;

const r2=document.getElementById('compare2').value;

const metric=document.getElementById('pollutantSelect').value;

const d1=allData[r1];
const d2=allData[r2];

document.getElementById('compareResult').innerHTML=`

<div class="compare-result" style="margin:20px;">

<h2>지역 비교 결과</h2>

<p>${r1} : ${d1[metric]} ${units[metric]}</p>

<p>${r2} : ${d2[metric]} ${units[metric]}</p>

<p>측정 시각 : ${formatTime(d1.time)}</p>

</div>

`;
}

function searchRegion(){

const keyword=document.getElementById('searchInput').value.trim();

if(!keyword){

render(allData);

return;
}

const filtered={};

Object.entries(allData).forEach(([r,v])=>{

if(r.includes(keyword)){

filtered[r]=v;

}

});

render(filtered);
}

function resetDashboard(){

document.getElementById('searchInput').value='';

document.getElementById('compareResult').innerHTML='';

render(allData);
}

document.getElementById('timeSelect')
.addEventListener('change',loadData);

document.getElementById('pollutantSelect')
.addEventListener('change',()=>renderCharts(allData));

loadData();

setInterval(loadData,3600000);
