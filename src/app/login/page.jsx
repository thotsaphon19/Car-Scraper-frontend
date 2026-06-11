'use client';
import{useState}from'react';
import{useRouter}from'next/navigation';
import{login}from'@/lib/auth';
export default function LoginPage(){
  const router=useRouter();
  const[form,setForm]=useState({username:'',password:''});
  const[error,setError]=useState('');
  const[loading,setLoading]=useState(false);
  const handleSubmit=async()=>{
    if(!form.username||!form.password)return setError('กรุณากรอกข้อมูลให้ครบ');
    setLoading(true);setError('');
    try{await login(form.username,form.password);router.push('/');}
    catch(e){setError(e.message);}
    setLoading(false);
  };
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f9fafb'}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 36px',width:360,boxShadow:'0 4px 24px rgba(0,0,0,.08)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:40}}>🚗</div>
          <h1 style={{fontSize:22,fontWeight:700,margin:'8px 0 4px'}}>ตลาดรถมือสอง</h1>
          <p style={{fontSize:13,color:'#9ca3af',margin:0}}>สำหรับทีมงานเท่านั้น</p>
        </div>
        {['username','password'].map(k=>(
          <div key={k} style={{marginBottom:14}}>
            <label style={{fontSize:13,fontWeight:500,color:'#374151',display:'block',marginBottom:6}}>{k==='username'?'Username':'Password'}</label>
            <input type={k==='password'?'password':'text'} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} placeholder={`กรอก ${k}`} autoFocus={k==='username'} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #d1d5db',fontSize:14,boxSizing:'border-box'}}/>
          </div>
        ))}
        {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#dc2626',marginBottom:16}}>❌ {error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',padding:11,borderRadius:8,background:loading?'#9ca3af':'#1d4ed8',color:'#fff',fontSize:15,fontWeight:600,border:'none',cursor:loading?'not-allowed':'pointer'}}>
          {loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  );
}
