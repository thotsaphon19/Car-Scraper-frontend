'use client';
const SOURCES=[{value:'',label:'ทุกแหล่ง'},{value:'facebook_marketplace',label:'FB Marketplace'},{value:'facebook_group',label:'FB Group'},{value:'one2car',label:'One2Car'},{value:'kaidee',label:'Kaidee'},{value:'taladrod',label:'Taladrod'}];
const inp={padding:'8px 12px',borderRadius:8,fontSize:14,width:'100%',boxSizing:'border-box',border:'1px solid #d1d5db',background:'#fff'};
export default function FilterBar({filters,onChange}){
  const set=(k,v)=>onChange(p=>({...p,[k]:v}));
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10,padding:16,background:'#fff',borderRadius:12,border:'1px solid #e5e7eb',marginBottom:8}}>
      <input style={inp} placeholder="🔍 ค้นหา เช่น Revo, D-Max" value={filters.keyword} onChange={e=>set('keyword',e.target.value)}/>
      <select style={inp} value={filters.source} onChange={e=>set('source',e.target.value)}>{SOURCES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
      <input style={inp} type="number" placeholder="💰 ราคาต่ำสุด (฿)" value={filters.minPrice} onChange={e=>set('minPrice',e.target.value)}/>
      <input style={inp} type="number" placeholder="💰 ราคาสูงสุด (฿)" value={filters.maxPrice} onChange={e=>set('maxPrice',e.target.value)}/>
      <input style={inp} placeholder="📍 จังหวัด" value={filters.location} onChange={e=>set('location',e.target.value)}/>
    </div>
  );
}
