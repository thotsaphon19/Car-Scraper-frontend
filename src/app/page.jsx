'use client';
import{useState,useEffect,useCallback,useRef}from'react';
import{useRouter}from'next/navigation';
import{isLoggedIn,logout,getUsername,apiFetch}from'@/lib/auth';

const BRANDS = {
  'Toyota':   ['Hilux Revo','Hilux Rocco','Hilux Vigo','Hilux Champ','Fortuner','MU-X'],
  'Isuzu':    ['D-Max','MU-X','MU-7'],
  'Ford':     ['Ranger','Ranger Raptor','Everest'],
  'Mitsubishi':['Triton','Strada','Pajero Sport'],
  'Nissan':   ['Navara','Frontier','Terra'],
  'Mazda':    ['BT-50'],
  'Chevrolet':['Colorado'],
  'MG':       ['Extender','ZS','HS'],
};

const SRC={
  facebook_marketplace:{label:'FB Marketplace',bg:'#1877f2',text:'#fff'},
  facebook_group:      {label:'FB Group',       bg:'#1877f2',text:'#fff'},
  one2car:             {label:'One2Car',         bg:'#dc2626',text:'#fff'},
  kaidee:              {label:'Kaidee',          bg:'#d97706',text:'#fff'},
  taladrod:            {label:'Taladrod',        bg:'#059669',text:'#fff'},
};

const SOURCES_PROGRESS = [
  {key:'marketplace', label:'Facebook Marketplace', icon:'🏪'},
  {key:'rss',         label:'Facebook Group',       icon:'👥'},
  {key:'one2car',     label:'One2Car',              icon:'🚗'},
  {key:'kaidee',      label:'Kaidee',               icon:'🔍'},
  {key:'taladrod',    label:'Taladrod',             icon:'🏷️'},
];

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

function ScrapeModal({onClose}){
  const[progress,setProgress]=useState([]);
  const[done,setDone]=useState(false);
  const[result,setResult]=useState(null);

  useEffect(()=>{
    let i=0;
    const interval=setInterval(()=>{
      if(i<SOURCES_PROGRESS.length){
        setProgress(p=>[...p,{...SOURCES_PROGRESS[i],status:'loading'}]);
        i++;
      }
    },800);

    // เรียก API trigger scrape
    apiFetch('/api/scrape',{method:'POST'}).then(()=>{
      clearInterval(interval);
      setProgress(SOURCES_PROGRESS.map(s=>({...s,status:'done'})));
      setDone(true);
      setResult('กำลังดึงข้อมูล... รอประมาณ 10-15 นาที หน้าเว็บจะอัปเดตอัตโนมัติ');
    }).catch(()=>{
      clearInterval(interval);
      setDone(true);
      setResult('หมายเหตุ: ต้องรัน node run-scraper.js บนโน้ตบุ๊คครับ');
    });

    return ()=>clearInterval(interval);
  },[]);

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:440,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <h2 style={{fontSize:18,fontWeight:700,color:'#111'}}>ดึงข้อมูลรถใหม่</h2>
          {done&&<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#6b7280'}}>✕</button>}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
          {SOURCES_PROGRESS.map(src=>{
            const p=progress.find(x=>x.key===src.key);
            const status=p?.status||'waiting';
            return(
              <div key={src.key} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,background:status==='done'?'#f0fdf4':status==='loading'?'#eff6ff':'#f9fafb',border:`1px solid ${status==='done'?'#bbf7d0':status==='loading'?'#bfdbfe':'#f1f5f9'}`}}>
                <span style={{fontSize:20}}>{src.icon}</span>
                <span style={{fontSize:13,fontWeight:500,flex:1,color:'#111'}}>{src.label}</span>
                {status==='done'&&<span style={{fontSize:13,color:'#16a34a',fontWeight:600}}>✅</span>}
                {status==='loading'&&<span style={{fontSize:12,color:'#3b82f6',fontWeight:500}}>กำลังดึง...</span>}
                {status==='waiting'&&<span style={{fontSize:12,color:'#9ca3af'}}>รอ...</span>}
              </div>
            );
          })}
        </div>

        {result&&(
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 16px',fontSize:13,color:'#166534',marginBottom:16}}>
            {result}
          </div>
        )}

        {!done&&(
          <div style={{textAlign:'center',color:'#6b7280',fontSize:13}}>
            <i className="ti ti-loader-2" style={{fontSize:20,display:'block',marginBottom:4}}></i>
            กรุณารัน node run-scraper.js บนโน้ตบุ๊คด้วยครับ
          </div>
        )}

        {done&&(
          <button onClick={onClose} style={{width:'100%',padding:11,borderRadius:10,background:'#1d4ed8',color:'#fff',fontSize:14,fontWeight:600,border:'none',cursor:'pointer'}}>
            ปิด
          </button>
        )}
      </div>
    </div>
  );
}

const inp = {padding:'9px 12px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',background:'#f9fafb',color:'#111',width:'100%',boxSizing:'border-box',fontFamily:'inherit'};

export default function Home(){
  const router=useRouter();
  const[ready,setReady]=useState(false);
  const[cars,setCars]=useState([]);
  const[stats,setStats]=useState(null);
  const[loading,setLoading]=useState(true);
  const[src,setSrc]=useState('');
  const[kw,setKw]=useState('');
  const[brand,setBrand]=useState('');
  const[model,setModel]=useState('');
  const[mn,setMn]=useState('');
  const[mx,setMx]=useState('');
  const[loc,setLoc]=useState('');
  const[cd,setCd]=useState(30);
  const[showScrape,setShowScrape]=useState(false);
  const timer=useRef(null);
  const cdTimer=useRef(null);

  useEffect(()=>{if(!isLoggedIn()){router.push('/login');return;}setReady(true);},[]);

  const fetchAll=useCallback(async()=>{
    const p=new URLSearchParams();
    if(src)p.set('source',src);
    // รวม keyword จาก search + brand + model
    const kwParts=[kw,brand,model].filter(Boolean);
    if(kwParts.length)p.set('keyword',kwParts.join(' '));
    if(mn)p.set('minPrice',mn);if(mx)p.set('maxPrice',mx);if(loc)p.set('location',loc);
    const[d,s]=await Promise.all([apiFetch(`/api/cars?${p}`),apiFetch('/api/stats')]);
    if(d)setCars(d.results||[]);if(s)setStats(s);
    setLoading(false);setCd(30);
  },[src,kw,brand,model,mn,mx,loc]);

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
  const models=brand?BRANDS[brand]||[]:[];

  return(
    <div style={{minHeight:'100vh',background:'#f1f5f9'}}>

      {showScrape&&<ScrapeModal onClose={()=>{setShowScrape(false);setLoading(true);fetchAll();}}/>}

      {/* Topbar */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,boxShadow:'0 1px 3px rgba(0,0,0,.05)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-car" style={{fontSize:18,color:'#fff'}}></i>
          </div>
          <span style={{fontSize:16,fontWeight:700,color:'#111'}}>ตลาดรถมือสอง</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'#f0fdf4',padding:'4px 12px',borderRadius:20}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>
            <span style={{fontSize:12,color:'#16a34a',fontWeight:600}}>Live</span>
          </div>
          <span style={{fontSize:12,color:'#94a3b8'}}>รีเฟรชใน {cd} วิ</span>
          <button onClick={()=>setShowScrape(true)}
            style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',border:'none',borderRadius:9,padding:'7px 14px',cursor:'pointer',fontSize:13,color:'#fff',display:'flex',alignItems:'center',gap:6,fontWeight:600}}>
            <i className="ti ti-refresh" style={{fontSize:14}}></i>ดึงข้อมูลใหม่
          </button>
          <button onClick={()=>{setLoading(true);fetchAll();}}
            style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'6px 12px',cursor:'pointer',fontSize:12,color:'#374151',display:'flex',alignItems:'center',gap:4}}>
            <i className="ti ti-refresh" style={{fontSize:13}}></i>รีเฟรช
          </button>
          <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:8,borderLeft:'1px solid #e2e8f0'}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#1d4ed8'}}>
              {getUsername()?.[0]?.toUpperCase()||'A'}
            </div>
            <span style={{fontSize:13,color:'#374151',fontWeight:500}}>{getUsername()}</span>
            <button onClick={()=>{logout();router.push('/login');}}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#94a3b8',padding:'4px 8px',borderRadius:6}}
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
          <StatCard icon="car"          label="รถทั้งหมด"   value={fmt(stats?.total)+' คัน'} sub={`จาก ${Object.keys(by).length} แหล่ง`} bg="#3b82f6"/>
          <StatCard icon="trending-down" label="ราคาต่ำสุด" value={fmt(stats?.priceRange?.min)+' ฿'} bg="#22c55e"/>
          <StatCard icon="chart-bar"    label="ราคาเฉลี่ย"  value={fmt(stats?.priceRange?.avg)+' ฿'} bg="#f59e0b"/>
          <StatCard icon="trending-up"  label="ราคาสูงสุด"  value={fmt(stats?.priceRange?.max)+' ฿'} bg="#ef4444"/>
        </div>

        {/* Filter bar */}
        <div style={{background:'#fff',borderRadius:14,padding:'16px',marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <div style={{position:'relative'}}>
              <i className="ti ti-search" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:15,color:'#9ca3af',pointerEvents:'none'}}></i>
              <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="ค้นหาชื่อรถ..."
                style={{...inp,paddingLeft:34}}
                onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            {/* Dropdown ยี่ห้อ */}
            <select value={brand} onChange={e=>{setBrand(e.target.value);setModel('');}}
              style={inp}
              onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">ยี่ห้อทั้งหมด</option>
              {Object.keys(BRANDS).map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            {/* Dropdown รุ่น */}
            <select value={model} onChange={e=>setModel(e.target.value)} disabled={!brand}
              style={{...inp,opacity:brand?1:0.5}}
              onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">รุ่นทั้งหมด</option>
              {models.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <input value={mn} onChange={e=>setMn(e.target.value)} type="number" placeholder="ราคาต่ำสุด (฿)"
              style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            <input value={mx} onChange={e=>setMx(e.target.value)} type="number" placeholder="ราคาสูงสุด (฿)"
              style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <input value={loc} onChange={e=>setLoc(e.target.value)} placeholder="📍 จังหวัด"
              style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            <button onClick={()=>{setKw('');setBrand('');setModel('');setMn('');setMx('');setLoc('');setSrc('');}}
              style={{...inp,background:'#f8fafc',cursor:'pointer',color:'#6b7280',display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'auto'}}>
              <i className="ti ti-x" style={{fontSize:13}}></i>ล้างตัวกรอง
            </button>
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

        {loading?(
          <div style={{textAlign:'center',padding:'80px 0',color:'#94a3b8'}}>
            <i className="ti ti-loader-2" style={{fontSize:32,display:'block',marginBottom:12}}></i>
            <div style={{fontSize:14}}>กำลังโหลด...</div>
          </div>
        ):cars.length===0?(
          <div style={{textAlign:'center',padding:'80px 0',color:'#94a3b8'}}>
            <i className="ti ti-car-off" style={{fontSize:40,display:'block',marginBottom:12}}></i>
            <div style={{fontSize:14,fontWeight:600,color:'#374151',marginBottom:4}}>ไม่พบรถที่ตรงกับเงื่อนไข</div>
            <div style={{fontSize:12,marginBottom:16}}>ลองปรับตัวกรองหรือดึงข้อมูลใหม่ครับ</div>
            <button onClick={()=>setShowScrape(true)}
              style={{background:'#1d4ed8',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:600}}>
              ดึงข้อมูลใหม่
            </button>
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
