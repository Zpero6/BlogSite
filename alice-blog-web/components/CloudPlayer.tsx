export default function CloudPlayer() {
  return (
    <div className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 md:p-8 flex flex-col justify-between transition-all duration-700 hover:scale-[1.01] min-h-[220px] md:min-h-[280px]">
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-black tracking-[0.24em] text-indigo-600 dark:text-indigo-400 uppercase">Current focus</span>
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.9)] animate-pulse" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">正在构建<br />Zpero の 小站</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">从模块化单体出发，完成内容、认证、互动和通知闭环。</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {['Java 21', 'Spring Boot', 'Next.js 16', 'MySQL 8'].map(item => <span key={item} className="px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 text-xs font-bold text-center text-slate-700 dark:text-slate-200">{item}</span>)}
      </div>
    </div>
  );
}

