const API=process.env.NEXT_PUBLIC_API_URL;
export async function login(username,password){
  const res=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  const data=await res.json();
  if(!res.ok) throw new Error(data.error||'Login failed');
  localStorage.setItem('token',data.token);
  localStorage.setItem('username',data.username);
  return data;
}
export function logout(){localStorage.removeItem('token');localStorage.removeItem('username');}
export function getToken(){if(typeof window==='undefined')return null;return localStorage.getItem('token');}
export function getUsername(){if(typeof window==='undefined')return null;return localStorage.getItem('username');}
export function isLoggedIn(){
  const t=getToken();if(!t)return false;
  try{const p=JSON.parse(atob(t.split('.')[1]));return p.exp*1000>Date.now();}catch{return false;}
}
export async function apiFetch(path,opts={}){
  const t=getToken();
  const res=await fetch(`${API}${path}`,{...opts,headers:{'Authorization':`Bearer ${t}`,...(opts.headers||{})}});
  if(res.status===401){logout();window.location.href='/login';return null;}
  return res.json();
}
