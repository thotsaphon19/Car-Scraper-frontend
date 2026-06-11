'use client';
import{useState,useEffect,useCallback,useRef}from'react';
import{useRouter}from'next/navigation';
import{isLoggedIn,logout,getUsername,apiFetch}from'@/lib/auth';

const SRC={
  facebook_marketplace:{label:'FB Marketplace',bg:'#1877f2',text:'#fff'},
  facebook_group:      {label:'FB Group',       bg:'#1877f2',text:'#fff'},
  one2car:             {label:'One2Car',         bg:'#dc2626',text:'#fff'},
  kaidee:              {label:'Kaidee',          bg:'#d97706',text:'#fff'},
  taladrod:            {label:'Taladrod',        bg:'#059669',text:'#fff'},
};

function fmt(n){return n?n.toLocaleString('th-TH'):'—';}
function ago(d){
  const s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)return s+'วิที่แล้ว';
  if(s<3600)return Math.floor(s/60)+'นาทีที่แล้ว';
  if(s<86400)return Math.floor(s/3600)+'ชม.ที่แล้ว';
  return Math.floor(s/86400)+'วันที่แล้ว';
}

function StatCard({icon,label,value,sub,bg}){
  return(
    <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <div style={{width:32,height:32,borderRadius:9,background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <i className={`ti ti-${icon}`} style={{fontSize:16,color:'#fff'}}></i>
        </div>
        <span style={{fontSize:12,color:'#6b7280',fontWeight:500}}>{label}</span>
      </div>
      <div style={{fontSize:20,fontWeight:700,color:'#111'}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{sub}</div>}
    </div>
  );
}

function CarCard({car}){
  const s=SRC[car.source]||{label:car.source,bg:'#6b7280',text:'#fff'};
  const[hover,setHover]=useState(false);
  return(
    <a href={car.listingUrl||'#'} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',color:'inherit',display:'block',height:'100%'}}>
      <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{background:'#fff',borderRadius:14,overflow:'hidden',border:`1px solid ${hover?'#3b82f6':'#f1f5f9'}`,boxShadow:hover?'0 4px 20px rgba(59,130,246,.12)':'0 1px 4px rgba(0,0,0,.06)',transition:'all .15s',height:'100%',display:'flex',flexDirection:'column'}}>
        <div style={{height:152,background:'#f8fafc',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          {car.imageUrl
            ?<img src={car.imageUrl} alt={car.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/>
            :<i className="ti ti-car" style={{fontSize:40,color:'#cbd5e1'}}></i>
          }
          <span style={{position:'absolute',top:10,right:10,fontSize:10,fontWeight:600,padding:'3px 9px',borderRadius:20,background:s.bg,color:s.text}}>{s.label}</span>
        </div>
        <div style={{padding:'14px 16px',flex:1,display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:13,fontWeight:600,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',color:'#111'}}>{car.title}</div>
          <div style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>{car.price?fmt(car.price)+' ฿':'ไม่ระบุราคา'}</div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {car.year&&<span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-calendar" style={{fontSize:12}}></i>{car.year}</span>}
            {car.mileage&&<span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-gauge" style={{fontSize:12}}></i>{car.mileage}</span>}
            {car.location&&<span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-map-pin" style={{fontSize:12}}></i>{car.location}</span>}
          </div>
        </div>
        <div style={{borderTop:'1px solid #f1f5f9',padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:11,color:'#9ca3af',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-clock" style={{fontSize:11}}></i>{ago(car.scrapedAt)}</span>
          <span style={{fontSize:11,color:'#3b82f6',display:'flex',alignItems:'center',gap:3,fontWeight:500}}>ดูประกาศ <i className="ti ti-external-link" style={{fontSize:11}}></i></span>
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
  const[src,setSrc]=useState('');
  const[kw,setKw]=useState('');
  const[mn,setMn]=useState('');
  const[mx,setMx]=useState('');
  const[loc,setLoc]=useState('');
  const[cd,setCd]=useState(30);
  const timer=useRef(null);
  const cdTimer=useRef(null);

  useEffect(()=>{if(!isLoggedIn()){router.push('/login');return;}setReady(true);},[]);

  const fetchAll=useCallback(async()=>{
    const p=new URLSearchParams();
    if(src)p.set('source',src);if(kw)p.set('keyword',kw);
    if(mn)p.set('minPrice',mn);if(mx)p.set('maxPrice',mx);if(loc)p.set('location',loc);
    const[d,s]=await Promise.all([apiFetch(`/api/cars?${p}`),apiFetch('/api/stats')]);
    if(d)setCars(d.results||[]);if(s)setStats(s);
    setLoading(false);setCd(30);
  },[src,kw,mn,mx,loc]);

  useEffect(()=>{
    if(!ready)return;
    setLoading(true);fetchAll();
    timer.current=setInterval(()=>fetchAll(),30000);
    cdTimer.current=setInterval(()=>setCd(c=>c>0?c-1:30),1000);
    return()=>{clearInterval(timer.current);clearInterval(cdTimer.current);};
  },[ready,fetchAll]);

  if(!ready)return null;

  const by=stats?.bySource||{};
  const sources=[
    {v:'',l:'ทั้งหมด',n:stats?.total||0},
    ...Object.entries(SRC).map(([v,c])=>({v,l:c.label,n:by[v]||0})).filter(s=>s.n>0),
  ];

  return(
    <div style={{minHeight:'100vh',background:'#f1f5f9'}}>

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-car" style={{fontSize:18,color:'#fff'}}></i>
          </div>
          <span style={{fontSize:16,fontWeight:700,color:'#111'}}>ตลาดรถมือสอง</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'#f0fdf4',padding:'4px 12px',borderRadius:20}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
            <span style={{fontSize:12,color:'#16a34a',fontWeight:600}}>Live</span>
          </div>
          <span style={{fontSize:12,color:'#94a3b8'}}>รีเฟรชใน {cd} วิ</span>
          <button onClick={()=>{setLoading(true);fetchAll();}}
            style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'6px 12px',cursor:'pointer',fontSize:12,color:'#374151',display:'flex',alignItems:'center',gap:6,fontWeight:500}}>
            <i className="ti ti-refresh" style={{fontSize:14}}></i>รีเฟรช
          </button>
          <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:8,borderLeft:'1px solid #e2e8f0'}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#1d4ed8'}}>
              {getUsername()?.[0]?.toUpperCase()||'A'}
            </div>
            <span style={{fontSize:13,color:'#374151',fontWeight:500}}>{getUsername()}</span>
            <button onClick={()=>{logout();router.push('/login');}}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#94a3b8',padding:'4px 8px',borderRadius:6,transition:'background .15s'}}
              onMouseEnter={e=>e.target.style.background='#f1f5f9'}
              onMouseLeave={e=>e.target.style.background='none'}>
              ออก
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'24px'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
          <StatCard icon="car"        label="รถทั้งหมด"   value={fmt(stats?.total)+' คัน'} sub={`จาก ${Object.keys(by).length} แหล่ง`} bg="#3b82f6"/>
          <StatCard icon="trending-down" label="ราคาต่ำสุด" value={fmt(stats?.priceRange?.min)+' ฿'} bg="#22c55e"/>
          <StatCard icon="chart-bar"  label="ราคาเฉลี่ย"  value={fmt(stats?.priceRange?.avg)+' ฿'} bg="#f59e0b"/>
          <StatCard icon="trending-up"  label="ราคาสูงสุด" value={fmt(stats?.priceRange?.max)+' ฿'} bg="#ef4444"/>
        </div>

        {/* Filter bar */}
        <div style={{background:'#fff',borderRadius:14,padding:'14px 16px',marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <i className="ti ti-search" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:15,color:'#9ca3af',pointerEvents:'none'}}></i>
              <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="ค้นหา เช่น Hilux Revo, D-Max, Fortuner..."
                style={{width:'100%',padding:'9px 12px 9px 34px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',boxSizing:'border-box',background:'#f9fafb'}}
                onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            {[
              {val:mn,set:setMn,ph:'ราคาต่ำสุด (฿)',w:140},
              {val:mx,set:setMx,ph:'ราคาสูงสุด (฿)',w:140},
              {val:loc,set:setLoc,ph:'จังหวัด',w:120},
            ].map(({val,set,ph,w})=>(
              <input key={ph} value={val} onChange={e=>set(e.target.value)} placeholder={ph} type={ph.includes('฿')?'number':'text'}
                style={{width:w,padding:'9px 12px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',background:'#f9fafb'}}
                onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            ))}
          </div>
        </div>

        {/* Source pills */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
          {sources.map(s=>(
            <button key={s.v} onClick={()=>setSrc(s.v)}
              style={{fontSize:12,padding:'5px 14px',borderRadius:20,border:'1.5px solid',borderColor:src===s.v?'#3b82f6':'#e2e8f0',background:src===s.v?'#eff6ff':'#fff',color:src===s.v?'#1d4ed8':'#6b7280',cursor:'pointer',fontWeight:src===s.v?600:400,transition:'all .15s',fontFamily:'inherit'}}>
              {s.l}{s.n>0&&` (${s.n})`}
            </button>
          ))}
        </div>

        {/* Section header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontSize:15,fontWeight:700,color:'#111'}}>รายการรถ</span>
          <span style={{fontSize:12,color:'#94a3b8'}}>{cars.length} คัน{stats?.lastRun&&` — อัปเดต ${ago(stats.lastRun)}`}</span>
        </div>

        {/* Cards */}
        {loading?(
          <div style={{textAlign:'center',padding:'80px 0',color:'#94a3b8'}}>
            <i className="ti ti-loader-2" style={{fontSize:32,display:'block',marginBottom:12}}></i>
            <div style={{fontSize:14}}>กำลังโหลด...</div>
          </div>
        ):cars.length===0?(
          <div style={{textAlign:'center',padding:'80px 0',color:'#94a3b8'}}>
            <i className="ti ti-car-off" style={{fontSize:40,display:'block',marginBottom:12}}></i>
            <div style={{fontSize:14,fontWeight:600,color:'#374151',marginBottom:4}}>ไม่พบรถที่ตรงกับเงื่อนไข</div>
            <div style={{fontSize:12}}>ลองรัน node run-scraper.js บนโน้ตบุ๊คก่อนครับ</div>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {cars.map(car=><CarCard key={car.id} car={car}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
