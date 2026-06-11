'use client';
import{useState,useEffect,useCallback,useRef}from'react';
import{useRouter}from'next/navigation';
import{isLoggedIn,logout,getUsername,apiFetch}from'@/lib/auth';

const SOURCE_CONFIG={
  facebook_marketplace:{label:'FB Marketplace',color:'#1877f2',bg:'#eef4ff',text:'#1877f2'},
  facebook_group:      {label:'FB Group',       color:'#1877f2',bg:'#eef4ff',text:'#1877f2'},
  one2car:             {label:'One2Car',         color:'#dc2626',bg:'#fef2f2',text:'#dc2626'},
  kaidee:              {label:'Kaidee',          color:'#d97706',bg:'#fffbeb',text:'#b45309'},
  taladrod:            {label:'Taladrod',        color:'#059669',bg:'#ecfdf5',text:'#047857'},
};

function fmt(n){return n?n.toLocaleString('th-TH'):'—';}
function timeAgo(d){
  const s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)return`${s} วิที่แล้ว`;
  if(s<3600)return`${Math.floor(s/60)} นาทีที่แล้ว`;
  if(s<86400)return`${Math.floor(s/3600)} ชม.ที่แล้ว`;
  return`${Math.floor(s/86400)} วันที่แล้ว`;
}

function StatCard({icon,label,value,sub,iconBg,iconColor}){
  return(
    <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'var(--border-radius-lg)',padding:'16px 18px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <i className={`ti ti-${icon}`} style={{fontSize:14,color:iconColor}} aria-hidden="true"></i>
        </div>
        <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{label}</span>
      </div>
      <div style={{fontSize:20,fontWeight:500,color:'var(--color-text-primary)'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'var(--color-text-tertiary)',marginTop:2}}>{sub}</div>}
    </div>
  );
}

function CarCard({car}){
  const src=SOURCE_CONFIG[car.source]||{label:car.source,bg:'#f3f4f6',text:'#6b7280'};
  return(
    <a href={car.listingUrl||'#'} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',color:'inherit',display:'block'}}>
      <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'var(--border-radius-lg)',overflow:'hidden',transition:'border-color .15s',height:'100%',display:'flex',flexDirection:'column'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--color-border-primary)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--color-border-tertiary)'}}>
        <div style={{height:148,background:'var(--color-background-secondary)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {car.imageUrl
            ?<img src={car.imageUrl} alt={car.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/>
            :<i className="ti ti-car" style={{fontSize:32,color:'var(--color-text-tertiary)'}} aria-hidden="true"></i>
          }
          <span style={{position:'absolute',top:8,right:8,fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:20,background:src.bg,color:src.text}}>{src.label}</span>
        </div>
        <div style={{padding:'12px 14px',flex:1,display:'flex',flexDirection:'column',gap:6}}>
          <div style={{fontSize:13,fontWeight:500,lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',color:'var(--color-text-primary)'}}>{car.title}</div>
          <div style={{fontSize:17,fontWeight:500,color:'var(--color-text-danger)'}}>{car.price?fmt(car.price)+' ฿':'ไม่ระบุราคา'}</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {car.year&&<span style={{fontSize:11,color:'var(--color-text-tertiary)',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-calendar" style={{fontSize:11}} aria-hidden="true"></i>{car.year}</span>}
            {car.mileage&&<span style={{fontSize:11,color:'var(--color-text-tertiary)',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-gauge" style={{fontSize:11}} aria-hidden="true"></i>{car.mileage}</span>}
            {car.location&&<span style={{fontSize:11,color:'var(--color-text-tertiary)',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-map-pin" style={{fontSize:11}} aria-hidden="true"></i>{car.location}</span>}
          </div>
        </div>
        <div style={{borderTop:'0.5px solid var(--color-border-tertiary)',padding:'8px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'var(--color-text-tertiary)',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-clock" style={{fontSize:11}} aria-hidden="true"></i>{timeAgo(car.scrapedAt)}</span>
          <span style={{fontSize:11,color:'var(--color-text-info)',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-external-link" style={{fontSize:11}} aria-hidden="true"></i>ดูประกาศ</span>
        </div>
      </div>
    </a>
  );
}

export default function Home(){
  const router=useRouter();
  const[ready,setReady]=useState(false);
  const[cars,setCars]=useState([]);
  const[stats,setStats]=useState(null);
  const[loading,setLoading]=useState(true);
  const[activeSource,setActiveSource]=useState('');
  const[keyword,setKeyword]=useState('');
  const[minPrice,setMinPrice]=useState('');
  const[maxPrice,setMaxPrice]=useState('');
  const[location,setLocation]=useState('');
  const[countdown,setCountdown]=useState(30);
  const timerRef=useRef(null);
  const cdRef=useRef(null);

  useEffect(()=>{if(!isLoggedIn()){router.push('/login');return;}setReady(true);},[]);

  const fetchAll=useCallback(async()=>{
    const p=new URLSearchParams();
    if(activeSource) p.set('source',activeSource);
    if(keyword)      p.set('keyword',keyword);
    if(minPrice)     p.set('minPrice',minPrice);
    if(maxPrice)     p.set('maxPrice',maxPrice);
    if(location)     p.set('location',location);
    const[d,s]=await Promise.all([apiFetch(`/api/cars?${p}`),apiFetch('/api/stats')]);
    if(d) setCars(d.results||[]);
    if(s) setStats(s);
    setLoading(false);
    setCountdown(30);
  },[activeSource,keyword,minPrice,maxPrice,location]);

  useEffect(()=>{
    if(!ready)return;
    setLoading(true);
    fetchAll();
    timerRef.current=setInterval(()=>fetchAll(),30000);
    cdRef.current=setInterval(()=>setCountdown(c=>c>0?c-1:30),1000);
    return()=>{clearInterval(timerRef.current);clearInterval(cdRef.current);};
  },[ready,fetchAll]);

  if(!ready)return null;

  const bySource=stats?.bySource||{};
  const sources=[
    {value:'',label:'ทั้งหมด',count:stats?.total||0},
    ...Object.entries(SOURCE_CONFIG).map(([v,c])=>({value:v,label:c.label,count:bySource[v]||0})).filter(s=>s.count>0),
  ];

  return(
    <div style={{minHeight:'100vh',background:'var(--color-background-tertiary)',fontFamily:'var(--font-sans)'}}>

      {/* Topbar */}
      <div style={{background:'var(--color-background-primary)',borderBottom:'0.5px solid var(--color-border-tertiary)',padding:'0 24px',height:52,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10,fontSize:15,fontWeight:500,color:'var(--color-text-primary)'}}>
          <div style={{width:30,height:30,borderRadius:8,background:'var(--color-background-info)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-car" style={{fontSize:16,color:'var(--color-text-info)'}} aria-hidden="true"></i>
          </div>
          ตลาดรถมือสอง
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontSize:11,padding:'2px 10px',borderRadius:20,background:'var(--color-background-success)',color:'var(--color-text-success)',fontWeight:500,display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--color-text-success)',display:'inline-block'}}></span>
            Live
          </div>
          <span style={{fontSize:12,color:'var(--color-text-tertiary)'}}>รีเฟรชใน {countdown} วิ</span>
          <button onClick={()=>{setLoading(true);fetchAll();}} style={{background:'none',border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-md)',padding:'4px 10px',cursor:'pointer',fontSize:12,color:'var(--color-text-secondary)',display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-refresh" style={{fontSize:13}} aria-hidden="true"></i>รีเฟรช
          </button>
          <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{getUsername()}</span>
          <button onClick={()=>{logout();router.push('/login');}} style={{background:'none',border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-md)',padding:'4px 10px',cursor:'pointer',fontSize:12,color:'var(--color-text-secondary)'}}>ออก</button>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          <StatCard icon="car"       label="รถทั้งหมด"  value={fmt(stats?.total)+' คัน'} sub={`จาก ${Object.keys(bySource).length} แหล่ง`} iconBg="var(--color-background-info)"    iconColor="var(--color-text-info)"/>
          <StatCard icon="arrow-down" label="ราคาต่ำสุด"  value={fmt(stats?.priceRange?.min)+' ฿'} iconBg="var(--color-background-success)" iconColor="var(--color-text-success)"/>
          <StatCard icon="chart-bar"  label="ราคาเฉลี่ย"  value={fmt(stats?.priceRange?.avg)+' ฿'} iconBg="var(--color-background-warning)" iconColor="var(--color-text-warning)"/>
          <StatCard icon="arrow-up"   label="ราคาสูงสุด"  value={fmt(stats?.priceRange?.max)+' ฿'} iconBg="var(--color-background-danger)"  iconColor="var(--color-text-danger)"/>
        </div>

        {/* Filter */}
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'var(--border-radius-lg)',padding:'14px 16px',marginBottom:12}}>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <i className="ti ti-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'var(--color-text-tertiary)',pointerEvents:'none'}} aria-hidden="true"></i>
              <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="ค้นหา เช่น Hilux Revo, D-Max..." style={{width:'100%',padding:'7px 12px 7px 32px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',fontSize:13,boxSizing:'border-box'}}/>
            </div>
            <input value={minPrice} onChange={e=>setMinPrice(e.target.value)} type="number" placeholder="ราคาต่ำสุด (฿)" style={{width:140,padding:'7px 12px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',fontSize:13}}/>
            <input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} type="number" placeholder="ราคาสูงสุด (฿)" style={{width:140,padding:'7px 12px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',fontSize:13}}/>
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="จังหวัด" style={{width:120,padding:'7px 12px',borderRadius:'var(--border-radius-md)',border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',fontSize:13}}/>
          </div>
        </div>

        {/* Source pills */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {sources.map(s=>(
            <button key={s.value} onClick={()=>setActiveSource(s.value)} style={{fontSize:12,padding:'4px 12px',borderRadius:20,border:'0.5px solid',borderColor:activeSource===s.value?'transparent':'var(--color-border-tertiary)',background:activeSource===s.value?'var(--color-background-info)':'var(--color-background-secondary)',color:activeSource===s.value?'var(--color-text-info)':'var(--color-text-secondary)',cursor:'pointer',fontFamily:'var(--font-sans)'}}>
              {s.label} {s.count>0&&`(${s.count})`}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{fontSize:14,fontWeight:500,color:'var(--color-text-primary)'}}>รายการรถ</span>
          <span style={{fontSize:12,color:'var(--color-text-tertiary)'}}>{cars.length} คัน{stats?.lastRun&&` — อัปเดต ${timeAgo(stats.lastRun)}`}</span>
        </div>

        {/* Cards */}
        {loading?(
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--color-text-tertiary)'}}>
            <i className="ti ti-loader" style={{fontSize:24,display:'block',marginBottom:8}} aria-hidden="true"></i>
            กำลังโหลด...
          </div>
        ):cars.length===0?(
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--color-text-tertiary)'}}>
            <i className="ti ti-car-off" style={{fontSize:32,display:'block',marginBottom:8}} aria-hidden="true"></i>
            ไม่พบรถที่ตรงกับเงื่อนไข
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:14}}>
            {cars.map(car=><CarCard key={car.id} car={car}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
