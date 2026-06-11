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
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#3b82f6 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:20,padding:'40px 36px',width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,.15)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:64,height:64,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <i className="ti ti-car" style={{fontSize:32,color:'#fff'}}></i>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:'#111',marginBottom:4}}>ตลาดรถมือสอง</h1>
          <p style={{fontSize:13,color:'#9ca3af'}}>สำหรับทีมงานเท่านั้น</p>
        </div>

        {['username','password'].map(k=>(
          <div key={k} style={{marginBottom:16}}>
            <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>
              {k==='username'?'Username':'Password'}
            </label>
            <input
              type={k==='password'?'password':'text'}
              value={form[k]}
              onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
              placeholder={k==='username'?'กรอก username':'กรอก password'}
              autoFocus={k==='username'}
              style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid #e5e7eb',fontSize:14,outline:'none',transition:'border-color .15s',background:'#f9fafb'}}
              onFocus={e=>e.target.style.borderColor='#1d4ed8'}
              onBlur={e=>e.target.style.borderColor='#e5e7eb'}
            />
          </div>
        ))}

        {error&&(
          <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#dc2626',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <i className="ti ti-alert-circle" style={{fontSize:16}}></i>{error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{width:'100%',padding:12,borderRadius:10,background:loading?'#93c5fd':'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',fontSize:15,fontWeight:600,border:'none',cursor:loading?'not-allowed':'pointer',transition:'opacity .15s'}}>
          {loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  );
}
