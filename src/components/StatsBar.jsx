'use client';
const fmt=n=>n?.toLocaleString('th-TH')??'-';
export default function StatsBar({stats,onRefresh}){
  if(!stats)return null;
  return(
    <div style={{marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:10}}>
        {[{icon:'🚗',label:'รถทั้งหมด',value:fmt(stats.total)+' คัน'},{icon:'💚',label:'ราคาต่ำสุด',value:fmt(stats.priceRange?.min)+' ฿'},{icon:'📊',label:'ราคาเฉลี่ย',value:fmt(stats.priceRange?.avg)+' ฿'},{icon:'🔴',label:'ราคาสูงสุด',value:fmt(stats.priceRange?.max)+' ฿'}].map(c=>(
          <div key={c.label} style={{padding:'12px 14px',borderRadius:10,border:'1px solid #e5e7eb',background:'#fff'}}>
            <div style={{fontSize:20}}>{c.icon}</div>
            <div style={{fontSize:16,fontWeight:600}}>{c.value}</div>
            <div style={{fontSize:12,color:'#6b7280'}}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        {Object.entries(stats.bySource||{}).map(([src,n])=>(
          <span key={src} style={{fontSize:12,padding:'3px 10px',borderRadius:20,background:'#f3f4f6',border:'1px solid #e5e7eb'}}>{src}: {n}</span>
        ))}
        <button onClick={onRefresh} style={{marginLeft:'auto',fontSize:12,padding:'4px 12px',borderRadius:8,border:'1px solid #d1d5db',background:'#fff',cursor:'pointer'}}>🔄 รีเฟรช</button>
        {stats.lastRun&&<span style={{fontSize:11,color:'#9ca3af'}}>อัปเดต: {new Date(stats.lastRun).toLocaleString('th-TH')}</span>}
      </div>
    </div>
  );
}
