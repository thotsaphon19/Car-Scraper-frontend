'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, logout, getUsername, apiFetch } from '@/lib/auth';

const BRANDS = {
  Toyota: ['Hilux Revo','Hilux Rocco','Hilux Vigo','Hilux Champ','Fortuner'],
  Isuzu:  ['D-Max','MU-X','MU-7'],
  Ford:   ['Ranger','Ranger Raptor','Everest'],
  Mitsubishi: ['Triton','Strada','Pajero Sport'],
  Nissan: ['Navara','Frontier','Terra'],
  Mazda:  ['BT-50'],
  Chevrolet: ['Colorado'],
  MG:     ['Extender','ZS','HS'],
};

const SRC = {
  facebook_marketplace: { label:'FB Marketplace', bg:'#1877f2', icon:'🏪' },
  facebook_group:       { label:'FB Group',        bg:'#1877f2', icon:'👥' },
  one2car:              { label:'One2Car',          bg:'#dc2626', icon:'🚗' },
  kaidee:               { label:'Kaidee',           bg:'#d97706', icon:'🔍' },
  taladrod:             { label:'Taladrod',          bg:'#059669', icon:'🏷️' },
};

const SOURCES_LIST = [
  { key:'facebook_marketplace', label:'Facebook Marketplace', icon:'🏪', pct:25 },
  { key:'facebook_group',       label:'Facebook Group (RSS)', icon:'👥', pct:15 },
  { key:'one2car',              label:'One2Car',              icon:'🚗', pct:25 },
  { key:'kaidee',               label:'Kaidee',               icon:'🔍', pct:20 },
  { key:'taladrod',             label:'Taladrod',             icon:'🏷️', pct:15 },
];

function fmt(n) { return n ? n.toLocaleString('th-TH') : '—'; }
function ago(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)   return s + 'วิที่แล้ว';
  if (s < 3600) return Math.floor(s/60) + 'นาทีที่แล้ว';
  if (s < 86400)return Math.floor(s/3600) + 'ชม.ที่แล้ว';
  return Math.floor(s/86400) + 'วันที่แล้ว';
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'});
}

// แก้ listingUrl ให้ถูกต้อง
function fixUrl(url, source) {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  if (source === 'one2car') return 'https://www.one2car.com' + url;
  if (source === 'kaidee')  return 'https://www.kaidee.com' + url;
  if (source === 'taladrod')return 'https://www.taladrod.com' + url;
  return url;
}

function CarCard({ car }) {
  const s = SRC[car.source] || { label: car.source, bg: '#6b7280', icon: '🚗' };
  const [hover, setHover] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const href = fixUrl(car.listingUrl, car.source);

  return (
    <div
      onClick={() => href !== '#' && window.open(href, '_blank')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:'#fff', borderRadius:14, overflow:'hidden', cursor:'pointer',
        border:`1px solid ${hover?'#3b82f6':'#f1f5f9'}`,
        boxShadow: hover ? '0 4px 20px rgba(59,130,246,.12)' : '0 1px 4px rgba(0,0,0,.06)',
        transition:'all .15s', display:'flex', flexDirection:'column',
      }}>
      <div style={{height:152,background:'#f8fafc',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {car.imageUrl && !imgErr
          ? <img src={car.imageUrl} alt={car.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={() => setImgErr(true)} />
          : <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,color:'#cbd5e1'}}>
              <i className="ti ti-car" style={{fontSize:40}}></i>
              <span style={{fontSize:10}}>ไม่มีรูป</span>
            </div>
        }
        <span style={{position:'absolute',top:10,left:10,fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:20,background:s.bg,color:'#fff'}}>{s.icon} {s.label}</span>
        {href !== '#' && <span style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,.45)',color:'#fff',borderRadius:20,padding:'2px 8px',fontSize:10}}>🔗</span>}
      </div>
      <div style={{padding:'14px 16px',flex:1,display:'flex',flexDirection:'column',gap:6}}>
        <div style={{fontSize:13,fontWeight:600,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{car.title}</div>
        <div style={{fontSize:18,fontWeight:700,color:'#dc2626'}}>{car.price ? fmt(car.price)+' ฿' : 'ไม่ระบุราคา'}</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {car.year    && <span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-calendar" style={{fontSize:11}}></i>{car.year}</span>}
          {car.mileage && <span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-gauge" style={{fontSize:11}}></i>{car.mileage}</span>}
          {car.location&& <span style={{fontSize:11,color:'#6b7280',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-map-pin" style={{fontSize:11}}></i>{car.location}</span>}
        </div>
      </div>
      <div style={{borderTop:'1px solid #f1f5f9',padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,color:'#9ca3af'}}>{ago(car.scrapedAt)}</span>
        <span style={{fontSize:11,color:'#3b82f6',fontWeight:500,display:'flex',alignItems:'center',gap:3}}>ดูประกาศ <i className="ti ti-external-link" style={{fontSize:11}}></i></span>
      </div>
    </div>
  );
}

function ScrapeModal({ onClose, onDone }) {
  const [current, setCurrent] = useState(0);
  const [pcts, setPcts] = useState({});
  const [totalPct, setTotalPct] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let src = 0, acc = 0;
    ref.current = setInterval(() => {
      if (src >= SOURCES_LIST.length) {
        clearInterval(ref.current); setTotalPct(100); setDone(true);
        setTimeout(onDone, 1500); return;
      }
      const key = SOURCES_LIST[src].key;
      setPcts(p => {
        const cur = p[key] || 0;
        if (cur >= 100) { acc += SOURCES_LIST[src].pct; setTotalPct(Math.min(Math.round(acc),99)); setCurrent(c=>c+1); src++; return p; }
        return { ...p, [key]: Math.min(cur+5, 100) };
      });
    }, 150);
    apiFetch('/api/scrape', { method:'POST' }).catch(()=>{});
    return () => clearInterval(ref.current);
  }, []);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:480,maxWidth:'92vw',boxShadow:'0 24px 64px rgba(0,0,0,.18)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
          <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${done?'#16a34a,#22c55e':'#1d4ed8,#3b82f6'})`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className={`ti ti-${done?'check':'refresh'}`} style={{fontSize:22,color:'#fff'}}></i>
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>{done ? 'ดึงข้อมูลเสร็จแล้ว! 🎉' : 'กำลังดึงข้อมูลรถ...'}</div>
            <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{done ? 'กำลังอัปเดตหน้าแสดงผล' : 'รันบนโน้ตบุ๊ค: node run-scraper.js'}</div>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:600,color:'#374151'}}>ความคืบหน้ารวม</span>
            <span style={{fontSize:14,fontWeight:700,color:'#1d4ed8'}}>{totalPct}%</span>
          </div>
          <div style={{height:12,background:'#e2e8f0',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${totalPct}%`,background:'linear-gradient(90deg,#1d4ed8,#3b82f6)',borderRadius:99,transition:'width .3s'}}></div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
          {SOURCES_LIST.map((src,i) => {
            const isDone=i<current, isActive=i===current&&!done;
            const pct = isDone ? 100 : (pcts[src.key]||0);
            return (
              <div key={src.key} style={{padding:'10px 14px',borderRadius:12,background:isDone?'#f0fdf4':isActive?'#eff6ff':'#f9fafb',border:`1px solid ${isDone?'#bbf7d0':isActive?'#bfdbfe':'#f1f5f9'}`,transition:'all .3s'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:isActive?8:0}}>
                  <span style={{fontSize:18}}>{src.icon}</span>
                  <span style={{fontSize:13,fontWeight:500,flex:1}}>{src.label}</span>
                  <span style={{fontSize:12,fontWeight:700,color:isDone?'#16a34a':isActive?'#1d4ed8':'#9ca3af'}}>
                    {isDone ? '✅ เสร็จ' : isActive ? `${pct}%` : '⏳ รอ'}
                  </span>
                </div>
                {isActive && <div style={{height:4,background:'#dbeafe',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'#3b82f6',borderRadius:99,transition:'width .15s'}}></div></div>}
              </div>
            );
          })}
        </div>
        {done
          ? <button onClick={onClose} style={{width:'100%',padding:12,borderRadius:10,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',fontSize:14,fontWeight:600,border:'none',cursor:'pointer'}}>ดูข้อมูลรถ</button>
          : <div style={{textAlign:'center',fontSize:12,color:'#94a3b8'}}>⏱ ประมาณ 10-15 นาที</div>
        }
      </div>
    </div>
  );
}

function ScrapeStatusBar({ history }) {
  if (!history?.length) return null;
  const latest = history[0], stats = latest.sourceStats || {};
  return (
    <div style={{background:'#fff',borderRadius:14,padding:'14px 18px',marginBottom:14,border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <i className="ti ti-activity" style={{fontSize:16,color:'#374151'}}></i>
        <span style={{fontSize:13,fontWeight:600}}>สถานะการดึงข้อมูลล่าสุด</span>
        <span style={{fontSize:11,color:'#9ca3af',marginLeft:'auto'}}>{fmtDate(latest.syncedAt)}</span>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {SOURCES_LIST.map(src => {
          const info = stats[src.key];
          const st = !info ? 'no-data' : info.error ? 'error' : (info.blocked||info.count===0) ? 'blocked' : 'ok';
          const map = { ok:'#f0fdf4,#16a34a,#bbf7d0', blocked:'#fffbeb,#b45309,#fcd34d', error:'#fef2f2,#dc2626,#fecaca', 'no-data':'#f9fafb,#9ca3af,#e5e7eb' };
          const [bg,tc,bc] = map[st].split(',');
          return (
            <div key={src.key} style={{padding:'6px 12px',borderRadius:20,background:bg,border:`1px solid ${bc}`,display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:14}}>{src.icon}</span>
              <span style={{fontSize:12,fontWeight:500,color:tc}}>{src.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:tc}}>
                {st==='ok'?`✅ ${info.count}คัน` : st==='blocked'?'⚠️ บล็อก' : st==='error'?'❌ Error' : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{position:'fixed',bottom:24,right:24,background:'#111',color:'#fff',padding:'14px 20px',borderRadius:12,fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:10,boxShadow:'0 8px 24px rgba(0,0,0,.2)',zIndex:300}}>
      <i className="ti ti-check" style={{fontSize:16,color:'#4ade80'}}></i>{msg}
      <button onClick={onClose} style={{background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:16,marginLeft:4}}>✕</button>
    </div>
  );
}

const inp = { padding:'9px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', background:'#f9fafb', color:'#111', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };

export default function App() {
  const router = useRouter();
  const [cars, setCars]       = useState([]);
  const [stats, setStats]     = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [src, setSrc]         = useState('');
  const [kw, setKw]           = useState('');
  const [brand, setBrand]     = useState('');
  const [model, setModel]     = useState('');
  const [mn, setMn]           = useState('');
  const [mx, setMx]           = useState('');
  const [loc, setLoc]         = useState('');
  const [selDate, setSelDate] = useState('');
  const [showScrape, setShowScrape] = useState(false);
  const [toast, setToast]     = useState('');
  const [cd, setCd]           = useState(30);
  const timerRef = useRef(null);
  const cdRef    = useRef(null);

  const fetchCars = useCallback(async (params={}) => {
    const p = new URLSearchParams();
    const s   = params.src     ?? src;
    const k   = [params.kw??kw, params.brand??brand, params.model??model].filter(Boolean).join(' ');
    const mn2 = params.mn      ?? mn;
    const mx2 = params.mx      ?? mx;
    const l   = params.loc     ?? loc;
    const d   = params.selDate ?? selDate;
    if (s)  p.set('source', s);
    if (k)  p.set('keyword', k);
    if (mn2)p.set('minPrice', mn2);
    if (mx2)p.set('maxPrice', mx2);
    if (l)  p.set('location', l);
    if (d)  p.set('date', d);
    const [data, st] = await Promise.all([apiFetch(`/api/cars?${p}`), apiFetch('/api/stats')]);
    if (data) setCars(data.results || []);
    if (st)   setStats(st);
    setLoading(false); setCd(30);
  }, [src, kw, brand, model, mn, mx, loc, selDate]);

  const fetchHistory = useCallback(async () => {
    const d = await apiFetch('/api/history');
    if (d) setHistory(d.days || []);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    fetchCars(); fetchHistory();
    timerRef.current = setInterval(() => fetchCars(), 30000);
    cdRef.current    = setInterval(() => setCd(c => c > 0 ? c-1 : 30), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(cdRef.current); };
  }, []);

  useEffect(() => { setLoading(true); fetchCars(); }, [src, kw, brand, model, mn, mx, loc, selDate]);

  const handleDone = useCallback(() => {
    setShowScrape(false); setLoading(true);
    Promise.all([fetchCars(), fetchHistory()]).then(() =>
      setToast('ดึงข้อมูลเสร็จแล้ว! อัปเดต ' + new Date().toLocaleTimeString('th-TH'))
    );
  }, [fetchCars, fetchHistory]);

  const by = stats?.bySource || {};
  const sources = [
    { v:'', l:'ทั้งหมด', n: stats?.total||0 },
    ...Object.entries(SRC).map(([v,c]) => ({ v, l:c.label, n:by[v]||0 })).filter(s => s.n > 0),
  ];
  const models = brand ? BRANDS[brand] || [] : [];

  return (
    <div style={{minHeight:'100vh',background:'#f1f5f9'}}>
      {showScrape && <ScrapeModal onClose={() => setShowScrape(false)} onDone={handleDone} />}
      {toast      && <Toast msg={toast} onClose={() => setToast('')} />}

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
          <button onClick={() => setShowScrape(true)} style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',border:'none',borderRadius:9,padding:'7px 16px',cursor:'pointer',fontSize:13,color:'#fff',display:'flex',alignItems:'center',gap:6,fontWeight:600}}>
            <i className="ti ti-database-import" style={{fontSize:15}}></i>ดึงข้อมูลใหม่
          </button>
          <button onClick={() => { setLoading(true); fetchCars(); }} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:9,padding:'6px 10px',cursor:'pointer',color:'#374151'}}>
            <i className="ti ti-refresh" style={{fontSize:14}}></i>
          </button>
          <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:8,borderLeft:'1px solid #e2e8f0'}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#1d4ed8'}}>
              {(getUsername()||'A')[0].toUpperCase()}
            </div>
            <span style={{fontSize:13,color:'#374151',fontWeight:500}}>{getUsername()}</span>
            <button onClick={() => { logout(); router.push('/login'); }} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#94a3b8',padding:'4px 8px',borderRadius:6}}>ออก</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1280,margin:'0 auto',padding:'24px'}}>
        <ScrapeStatusBar history={history} />

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:14,marginBottom:20}}>
          <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:9,background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-car" style={{fontSize:16,color:'#fff'}}></i></div>
              <span style={{fontSize:12,color:'#6b7280',fontWeight:500}}>รถทั้งหมด</span>
            </div>
            <div style={{fontSize:24,fontWeight:700,marginBottom:6}}>{fmt(stats?.total)} คัน</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {Object.entries(by).map(([s,n]) => <span key={s} style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#f1f5f9',color:'#374151'}}>{SRC[s]?.icon||'🚗'} {n}</span>)}
            </div>
          </div>
          <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
            <div style={{fontSize:12,color:'#6b7280',marginBottom:6}}>ราคาต่ำสุด / สูงสุด</div>
            <div style={{fontSize:15,fontWeight:700,color:'#16a34a'}}>{fmt(stats?.priceRange?.min)} ฿</div>
            <div style={{fontSize:15,fontWeight:700,color:'#dc2626'}}>{fmt(stats?.priceRange?.max)} ฿</div>
          </div>
          <div style={{background:'#fff',borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
            <div style={{fontSize:12,color:'#6b7280',marginBottom:6}}>ราคาเฉลี่ย</div>
            <div style={{fontSize:22,fontWeight:700,color:'#f59e0b'}}>{fmt(stats?.priceRange?.avg)} ฿</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{background:'#fff',borderRadius:14,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',border:'1px solid #f1f5f9'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <div style={{position:'relative'}}>
              <i className="ti ti-search" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',fontSize:15,color:'#9ca3af',pointerEvents:'none'}}></i>
              <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="ค้นหาชื่อรถ..." style={{...inp,paddingLeft:34}} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            <select value={brand} onChange={e=>{setBrand(e.target.value);setModel('');}} style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">ยี่ห้อทั้งหมด</option>
              {Object.keys(BRANDS).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={model} onChange={e=>setModel(e.target.value)} disabled={!brand} style={{...inp,opacity:brand?1:.5}} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">รุ่นทั้งหมด</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={mn} onChange={e=>setMn(e.target.value)} type="number" placeholder="ราคาต่ำสุด (฿)" style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            <input value={mx} onChange={e=>setMx(e.target.value)} type="number" placeholder="ราคาสูงสุด (฿)" style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10}}>
            <input value={loc} onChange={e=>setLoc(e.target.value)} placeholder="📍 จังหวัด" style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            <select value={selDate} onChange={e=>setSelDate(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">📅 ทุกวัน (ล่าสุด)</option>
              {history.map(h => <option key={h.date} value={h.date}>{fmtDate(h.syncedAt)} — {h.total} คัน</option>)}
            </select>
            <button onClick={()=>{setKw('');setBrand('');setModel('');setMn('');setMx('');setLoc('');setSrc('');setSelDate('');}} style={{padding:'9px 16px',borderRadius:10,border:'1.5px solid #e5e7eb',background:'#f8fafc',cursor:'pointer',fontSize:13,color:'#6b7280',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',fontFamily:'inherit'}}>
              <i className="ti ti-x" style={{fontSize:13}}></i>ล้าง
            </button>
          </div>
        </div>

        {/* Source pills */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
          {sources.map(s => (
            <button key={s.v} onClick={()=>setSrc(s.v)} style={{fontSize:12,padding:'5px 14px',borderRadius:20,border:'1.5px solid',borderColor:src===s.v?'#3b82f6':'#e2e8f0',background:src===s.v?'#eff6ff':'#fff',color:src===s.v?'#1d4ed8':'#6b7280',cursor:'pointer',fontWeight:src===s.v?600:400,transition:'all .15s',fontFamily:'inherit'}}>
              {s.l}{s.n>0&&` (${s.n})`}
            </button>
          ))}
          {selDate && <span style={{fontSize:12,padding:'5px 14px',borderRadius:20,background:'#fffbeb',border:'1px solid #fcd34d',color:'#b45309',fontWeight:600}}>📅 {fmtDate(selDate)}</span>}
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontSize:15,fontWeight:700,color:'#111'}}>รายการรถ</span>
          <span style={{fontSize:12,color:'#94a3b8'}}>{cars.length} คัน{stats?.lastRun&&` — อัปเดต ${ago(stats.lastRun)}`}</span>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'#94a3b8'}}>
            <i className="ti ti-loader-2" style={{fontSize:32,display:'block',marginBottom:12}}></i>
            <div style={{fontSize:14}}>กำลังโหลด...</div>
          </div>
        ) : cars.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0',color:'#94a3b8'}}>
            <i className="ti ti-car-off" style={{fontSize:40,display:'block',marginBottom:12}}></i>
            <div style={{fontSize:14,fontWeight:600,color:'#374151',marginBottom:4}}>ไม่พบรถที่ตรงกับเงื่อนไข</div>
            <button onClick={()=>setShowScrape(true)} style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:600,marginTop:8}}>ดึงข้อมูลใหม่</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {cars.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        )}
      </div>
    </div>
  );
}
