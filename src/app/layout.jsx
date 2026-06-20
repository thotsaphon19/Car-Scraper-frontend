export const metadata={title:'ตลาดรถมือสอง',description:'รถกระบะ SUV มือสอง'};
export default function RootLayout({children}){
  return(
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.11.0/tabler-icons.min.css"/>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;}
          input,select,button{font-family:inherit;}
        `}</style>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
