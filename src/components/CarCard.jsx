'use client';
const BADGE={facebook_marketplace:{label:'FB Marketplace',bg:'#1877f2'},facebook_group:{label:'FB Group',bg:'#1877f2'},one2car:{label:'One2Car',bg:'#e63946'},kaidee:{label:'Kaidee',bg:'#f4a261'},taladrod:{label:'Taladrod',bg:'#2a9d8f'}};
const fmt=n=>n?n.toLocaleString('th-TH')+' ฿':'ไม่ระบุราคา';
export default function CarCard({car}){
  const b=BADGE[car.source]||{label:car.source,bg:'#6b7280'};
  return(
    <a href={car.listingUrl} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none',color:'inherit',display:'block'}}>
      <div style={{border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',background:'#fff',transition:'box-shadow .15s',height:'100%'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
        <div style={{position:'relative',height:180,background:'#f3f4f6'}}>
          {car.imageUrl?<img src={car.imageUrl} alt={car.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:40}}>🚗</div>}
          <span style={{position:'absolute',top:8,right:8,background:b.bg,color:'#fff',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>{b.label}</span>
        </div>
        <div style={{padding:'12px 14px 14px'}}>
          <div style={{fontSize:14,fontWeight:600,lineHeight:1.4,marginBottom:6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{car.title}</div>
          <div style={{fontSize:18,fontWeight:700,color:'#e63946',marginBottom:8}}>{fmt(car.price)}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,fontSize:12,color:'#6b7280'}}>
            {car.year&&<span>📅 {car.year}</span>}
            {car.mileage&&<span>📏 {car.mileage}</span>}
            {car.location&&<span>📍 {car.location}</span>}
          </div>
          <div style={{marginTop:8,fontSize:11,color:'#9ca3af'}}>{new Date(car.scrapedAt).toLocaleString('th-TH')}</div>
        </div>
      </div>
    </a>
  );
}
