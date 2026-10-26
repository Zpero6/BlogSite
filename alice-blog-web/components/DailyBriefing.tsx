'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, History, Minus, Pause, Play, Plus, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { briefingAsOfDate, briefingCovers, briefingDisplay, briefingChannels, briefingIssues as publishedIssues, briefingTopics, type BriefingItem } from '../data/dailyBriefing';
import { beijingCalendarDate, getBriefingWindow, stepBriefingDate } from '../lib/briefingWindow';

import { terraReadingNotes } from '../data/terraReadingNotes';

type ReadingState = { read: string[]; saved: string[]; topics: string[]; terraNotes: boolean };
const initialState: ReadingState = { read: [], saved: [], topics: briefingTopics, terraNotes: briefingDisplay.showTerraNotes };
const storageKey = 'xh-daily-letter-v1';
const briefingCarouselDays = briefingDisplay.carouselDays;
const categoryName = (category: string) => briefingChannels.find(channel => channel.id === category)?.name ?? category;

export default function DailyBriefing() {
  const [expanded, setExpanded] = useState(false);
  const [windowDate, setWindowDate] = useState(briefingAsOfDate);
  const briefingIssues = useMemo(() => getBriefingWindow(publishedIssues, windowDate, briefingDisplay.archiveDays), [windowDate]);
  const carouselIssues = useMemo(() => getBriefingWindow(briefingIssues, windowDate, briefingCarouselDays), [briefingIssues, windowDate]);
  const carouselDates = useMemo(() => carouselIssues.map(issue => issue.edition.date), [carouselIssues]);
  const [autoPlay, setAutoPlay] = useState(briefingDisplay.autoPlay);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [issueDate, setIssueDate] = useState(publishedIssues[0]?.edition.date ?? briefingAsOfDate);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [draftTerraNotes, setDraftTerraNotes] = useState(briefingDisplay.showTerraNotes);
  const issueIndex = Math.max(0, briefingIssues.findIndex(issue => issue.edition.date === issueDate));
  const issue = briefingIssues[issueIndex];
  const briefingEdition = issue?.edition ?? { date: windowDate, weekday: '', label: '每日选刊', notice: `最近 ${briefingDisplay.archiveDays} 天暂无可用选刊，请稍后再来。` };
  const briefingItems = (issue?.items ?? []).filter(item => briefingChannels.some(channel => channel.id === item.category));
  const briefingCover = briefingCovers[briefingEdition.date] ?? { src: '/images/briefing-default.svg', alt: '每日选刊默认封面' };
  const coverSources = [...new Set([briefingCover.src, ...carouselIssues.map(entry => briefingCovers[entry.edition.date]?.src ?? '/images/briefing-default.svg')])];
  const isLatest = issueIndex === 0;
  const carouselIndex = carouselDates.indexOf(briefingEdition.date);
  const [reading, setReading] = useState<ReadingState>(initialState);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftTopics, setDraftTopics] = useState(briefingTopics);
  const [message, setMessage] = useState('');
  const reader = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const banner = useRef<HTMLButtonElement>(null);
  const headline = briefingItems[0]?.title ?? '从你关注的方向，开始今天的阅读';
  useEffect(() => {
    const refresh = () => setWindowDate(beijingCalendarDate());
    refresh();
    const timer = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(query.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    query.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { query.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);

  useEffect(() => {
    if (!briefingDisplay.enabled || !ready || !autoPlay || hovered || focused || expanded || selectedId || !pageVisible || reducedMotion || carouselIndex < 0 || carouselDates.length < 2) return;
    const timer = setTimeout(() => {
      const date = stepBriefingDate(carouselDates, briefingEdition.date, 1);
      if (date) setIssueDate(date);
    }, briefingDisplay.intervalSeconds * 1000);
    return () => clearTimeout(timer);
  }, [ready, autoPlay, hovered, focused, expanded, selectedId, pageVisible, reducedMotion, carouselIndex, carouselDates, briefingEdition.date]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (stored && ['read', 'saved', 'topics'].every(key => Array.isArray(stored[key]) && stored[key].every((value: unknown) => typeof value === 'string'))) {
        setReading({ read: stored.read, saved: stored.saved, topics: stored.topics.some((topic: string) => briefingTopics.includes(topic)) ? stored.topics.filter((topic: string) => briefingTopics.includes(topic)) : briefingTopics, terraNotes: typeof stored.terraNotes === 'boolean' ? stored.terraNotes : briefingDisplay.showTerraNotes });
      }
    } catch { /* Reading is still available when storage is disabled. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(reading)); } catch { /* Persistence is optional. */ }
  }, [ready, reading]);

  useEffect(() => {
    if (expanded) reader.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, [expanded]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  function matches(item: BriefingItem) { return !briefingTopics.length || item.tags.some(tag => reading.topics.includes(tag)); }
  const followedItems = briefingItems.filter(matches);
  const items = followedItems.filter(item => !savedOnly || reading.saved.includes(item.id));
  const selected = briefingItems.find(item => item.id === selectedId);
  const terraNote = selected ? selected.terraNote ?? terraReadingNotes[selected.id] : undefined;
  const unread = followedItems.filter(item => !reading.read.includes(item.id)).length;

  useEffect(() => {
    if (!selected || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    setReading(previous => previous.read.includes(selected.id) ? previous : { ...previous, read: [...previous.read, selected.id] });
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      lastFocus.current?.focus({ preventScroll: true });
    };
  }, [selected?.id]);

  function toggleSaved(id: string) {
    setReading(previous => ({ ...previous, saved: previous.saved.includes(id) ? previous.saved.filter(value => value !== id) : [...previous.saved, id] }));
  }

  function choose(item: BriefingItem) {
    lastFocus.current = document.activeElement as HTMLElement;
    setSelectedId(item.id);
  }

  function changeIssue(date: string) {
    if (!briefingIssues.some(issue => issue.edition.date === date)) return;
    setSelectedId(null);
    setIssueDate(date);
    setMessage('已切换至 ' + date + ' 选刊');
  }

  function collapse() {
    setExpanded(false);
    banner.current?.focus({ preventScroll: true });
    banner.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
  }

  if (!briefingDisplay.enabled) return null;

  return (<>
    <section id="daily-briefing" aria-label={briefingDisplay.title + '，' + briefingDisplay.subtitle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }} className="scroll-mt-28 overflow-hidden rounded-3xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-800/50">
      <div className="relative">
      <button ref={banner} type="button" aria-expanded={expanded} aria-controls="daily-letter-reader" onClick={() => expanded ? collapse() : setExpanded(true)} className="group relative block bg-slate-900 min-h-[206px] w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white sm:min-h-[190px]">
        {briefingDisplay.showCovers && coverSources.map(src => <img key={src} src={src} alt={src === briefingCover.src ? briefingCover.alt : ''} aria-hidden={src !== briefingCover.src} style={{ opacity: src === briefingCover.src ? 1 : 0 }} className="absolute inset-0 h-full w-full object-cover object-[72%_45%] transition-opacity duration-1000 motion-reduce:transition-none sm:object-[center_43%]" />)}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/5 sm:via-slate-950/30" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <span className="relative flex min-h-[206px] flex-col justify-between p-5 sm:min-h-[190px] sm:px-8 sm:py-6">
          <span className="flex min-h-8 items-center gap-2.5 pr-40 text-[9px] font-bold tracking-[0.2em] text-white/75 sm:pr-40 sm:text-[10px]"><span className="hidden rounded-md border border-white/15 bg-white/10 px-2 py-1 tracking-[0.15em] backdrop-blur-sm sm:inline">DAILY SIGNAL</span><span className="font-mono tracking-wider">{briefingEdition.date}</span><span className="hidden truncate text-white/45 md:inline">/ {briefingEdition.label}</span></span>
          <span className="my-4 block max-w-[85%] sm:my-3 sm:max-w-[68%]"><span className="mb-1 block text-[10px] tracking-[0.28em] text-indigo-200/90">{briefingDisplay.title}</span><span className="block text-2xl font-black leading-snug tracking-wide text-white drop-shadow-md sm:text-[30px]">{briefingDisplay.subtitle}</span><span key={briefingEdition.date} className="mt-2 block truncate text-[11px] leading-relaxed tracking-wide text-white/80 sm:text-xs">{headline}</span></span>
          <span className="flex items-end justify-between gap-3"><span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/75">{briefingChannels.map(channel => <span key={channel.id}>{channel.name} <b className="ml-1 font-mono font-normal text-white">{pad(followedItems.filter(item => item.category === channel.id).length)}</b></span>)}{unread > 0 && <span className="flex items-center gap-1.5 text-pink-200"><span className="h-1 w-1 rounded-full bg-pink-300" />{unread} 条未读</span>}</span><span className="flex shrink-0 items-center gap-2 text-white/90"><span className="hidden text-[10px] tracking-wide sm:inline">{expanded ? '收起这封来信' : isLatest ? '展开今日选刊' : '展开往期选刊'}</span><span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition duration-500 group-hover:border-white/60 group-hover:bg-white/20 sm:h-9 sm:w-9">{expanded ? <Minus size={16} /> : <Plus size={16} />}</span></span></span>
        </span>
      </button>
      <div role="group" aria-label={`最近 ${briefingCarouselDays} 天选刊轮播`} className="absolute right-4 top-5 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/25 p-1 text-white backdrop-blur-md sm:right-7 sm:top-6">
        <button type="button" aria-label="卡片上一期" disabled={carouselDates.length < 2 || carouselIndex < 0} onClick={() => { const date = stepBriefingDate(carouselDates, briefingEdition.date, 1); if (date) changeIssue(date); }} className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-30"><ChevronLeft size={15} /></button>
        <span aria-hidden="true" className="min-w-8 text-center font-mono text-[10px] text-white/80">{carouselIndex < 0 ? '往期' : `${carouselIndex + 1}/${carouselDates.length}`}</span>
        <button type="button" aria-label="卡片下一期" disabled={carouselDates.length < 2 || carouselIndex < 0} onClick={() => { const date = stepBriefingDate(carouselDates, briefingEdition.date, -1); if (date) changeIssue(date); }} className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-30"><ChevronRight size={15} /></button>
        <button type="button" aria-label={autoPlay ? '暂停选刊轮播' : '播放选刊轮播'} aria-pressed={!autoPlay} disabled={carouselDates.length < 2 || reducedMotion} onClick={() => setAutoPlay(value => !value)} className="flex h-8 w-8 items-center justify-center rounded-full border-l border-white/15 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-30">{autoPlay ? <Pause size={12} /> : <Play size={12} />}</button>
      </div>
      </div>

      <AnimatedDisclosure open={expanded}>
      <div ref={reader} id="daily-letter-reader" className="scroll-mt-24 border-t border-white/30 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 px-5 py-4 sm:px-7 dark:border-white/10">
          <div className="flex items-baseline gap-2.5"><h2 className="text-base tracking-wider text-slate-800 dark:text-white">{isLatest ? '本期来信' : '往期来信'}</h2><span className="text-[10px] text-slate-500 dark:text-slate-400">{briefingEdition.date} · {briefingEdition.weekday} · {followedItems.length} 则选刊</span></div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]"><button type="button" aria-expanded={archiveOpen} aria-controls="daily-letter-archive" onClick={() => setArchiveOpen(value => !value)} className="flex items-center gap-1.5 text-slate-500 transition hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"><History size={13} />往期查看</button><button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly(value => !value)} className={`flex items-center gap-1.5 transition hover:text-indigo-500 ${savedOnly ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}><Bookmark size={13} fill={savedOnly ? 'currentColor' : 'none'} />{savedOnly ? '已收藏' : '只看收藏'}</button><span className="h-3 w-px bg-slate-300/60 dark:bg-white/15" /><button type="button" aria-expanded={settingsOpen} aria-controls="daily-letter-settings" onClick={() => { setDraftTopics([...reading.topics]); setDraftTerraNotes(reading.terraNotes); setSettingsOpen(value => !value); }} className="flex items-center gap-1.5 text-slate-500 transition hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"><SlidersHorizontal size={13} />关注方向</button></div>
        </div>

        <AnimatedDisclosure open={archiveOpen}>
        <div id="daily-letter-archive" className="border-b border-slate-200/50 bg-white/20 px-5 py-4 sm:px-7 dark:border-white/10 dark:bg-slate-950/10">
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <label htmlFor="daily-issue-date" className="text-slate-500 dark:text-slate-400">翻阅日期</label>
            <select id="daily-issue-date" aria-label="选择选刊日期" value={briefingEdition.date} onChange={event => changeIssue(event.target.value)} className="min-w-0 rounded-lg border border-slate-200/70 bg-white/60 px-3 py-2 text-slate-700 outline-offset-2 focus-visible:outline-indigo-400 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200">{briefingIssues.map((entry,index)=><option key={entry.edition.date} value={entry.edition.date}>{entry.edition.date} · {index === 0 ? '最新' : '已归档'}</option>)}</select>
            <button type="button" disabled={!issue || issueIndex === briefingIssues.length - 1} onClick={()=>changeIssue(briefingIssues[issueIndex + 1].edition.date)} className="px-1 py-2 text-slate-500 hover:text-indigo-500 disabled:cursor-default disabled:opacity-30 dark:text-slate-400">上一期</button>
            <button type="button" disabled={!issue || isLatest} onClick={()=>changeIssue(briefingIssues[issueIndex - 1].edition.date)} className="px-1 py-2 text-slate-500 hover:text-indigo-500 disabled:cursor-default disabled:opacity-30 dark:text-slate-400">下一期</button>
            {!isLatest && <button type="button" onClick={()=>changeIssue(briefingIssues[0].edition.date)} className="ml-auto px-1 py-2 text-indigo-500 dark:text-indigo-300">回到最新</button>}
          </div>
          <p className="mt-2 text-[10px] leading-6 text-slate-400">最近 {briefingDisplay.archiveDays} 天 · {briefingIssues.length} 期完整选刊。首页轮播最近 {briefingCarouselDays} 天内已有的 {carouselIssues.length} 期，展开阅读时暂停切换。</p>
        </div>
        </AnimatedDisclosure>

        <AnimatedDisclosure open={settingsOpen}>
        <div id="daily-letter-settings" className="border-b border-slate-200/50 bg-white/25 px-5 py-5 sm:px-7 dark:border-white/10 dark:bg-slate-950/15">
          <div className="flex items-start justify-between gap-4"><div><h3 className="text-sm text-slate-700 dark:text-slate-200">选择你关心的方向</h3><p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-slate-400">选择本期想看的内容，偏好保存在当前浏览器。</p></div><button type="button" aria-label="关闭关注设置" onClick={() => setSettingsOpen(false)} className="p-1 text-slate-400 hover:text-indigo-500"><X size={16} /></button></div>
          <div className="mt-4 flex flex-wrap gap-2">{briefingTopics.map(topic => { const checked = draftTopics.includes(topic); return <button key={topic} type="button" aria-pressed={checked} onClick={() => setDraftTopics(previous => checked ? previous.filter(value => value !== topic) : [...previous, topic])} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] transition ${checked ? 'border-indigo-200 bg-white/60 text-indigo-600 dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-200' : 'border-slate-200/70 text-slate-400 dark:border-white/10'}`}>{checked && <Check size={11} />}{topic}</button>; })}</div>
          {briefingDisplay.showTerraNotes && <label className="mt-5 flex cursor-pointer items-start gap-2.5 border-t border-slate-200/50 pt-4 dark:border-white/10"><input type="checkbox" checked={draftTerraNotes} onChange={event=>setDraftTerraNotes(event.target.checked)} className="mt-1 accent-indigo-500" /><span><span className="block text-[11px] text-slate-600 dark:text-slate-300">显示可选的附加阅读</span><span className="mt-1 block text-[10px] leading-5 text-slate-400">只在适合的文献末尾出现，默认折叠，不改变论文摘要。</span></span></label>}
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-[10px] text-slate-500 dark:text-slate-400">{!briefingTopics.length ? '当前未限制关注主题，显示全部内容' : draftTopics.length ? '关注、已读和收藏保存在当前浏览器' : '请至少选择一个方向'}</span><button type="button" disabled={briefingTopics.length > 0 && !draftTopics.length} onClick={() => { setReading(previous => ({ ...previous, topics: draftTopics, terraNotes: draftTerraNotes })); setSettingsOpen(false); setMessage('关注方向已保存'); }} className="rounded-lg bg-slate-800 px-4 py-2 text-[11px] text-white transition hover:bg-indigo-600 disabled:opacity-40 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white">保存关注</button></div>
        </div>
        </AnimatedDisclosure>

        <nav aria-label="本期选刊目录" className="grid min-w-0 grid-cols-1 gap-7 px-5 py-6 sm:grid-cols-2 sm:gap-10 sm:px-7">
          {briefingChannels.map((channel, channelIndex) => {
            const category = channel.id;
            const group = items.filter(item => item.category === category);
            return <div key={category} className="min-w-0">
              <div className="mb-2 flex items-center gap-2 border-b border-slate-200/60 pb-3 dark:border-white/10"><span className={`h-1 w-1 rounded-full ${channelIndex % 2 === 0 ? 'bg-indigo-400' : 'bg-emerald-400'}`} /><h3 className="text-xs font-medium tracking-widest text-slate-600 dark:text-slate-300">{channel.name}</h3><span className="ml-auto font-mono text-[10px] text-slate-400">{pad(group.length)}</span></div>
              {group.map((item, index) => <button key={item.id} type="button" onClick={() => choose(item)} aria-label={`打开阅读窗口：${item.title}`} className="group flex w-full gap-3 border-b border-slate-200/40 py-4 text-left transition last:border-b-0 hover:translate-x-1 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-indigo-400 dark:border-white/5"><span className="mt-1 font-mono text-[9px] text-indigo-400/80">{pad(index + 1)}</span><span className="min-w-0 flex-1"><span className="block text-[13px] font-bold leading-6 text-slate-700 transition group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-300">{item.title}</span><span className="mt-1.5 block truncate text-[11px] leading-6 text-slate-500 dark:text-slate-400">{item.summary}</span><span className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-slate-400"><span className="min-w-0 truncate">{item.source}</span><span>· {item.sourceDate}</span>{reading.saved.includes(item.id) && <Bookmark size={10} className="shrink-0" fill="currentColor" />}{!reading.read.includes(item.id) && <span className="h-1 w-1 shrink-0 rounded-full bg-pink-400" />}</span></span><ArrowUpRight size={14} className="mt-1 shrink-0 text-slate-400 transition group-hover:text-indigo-400" /></button>)}
              {group.length === 0 && <p className="py-8 text-[11px] leading-6 text-slate-400">{!issue ? `最近 ${briefingDisplay.archiveDays} 天暂无可用选刊` : savedOnly ? '这一栏还没有收藏' : '当前关注下暂无选刊'}</p>}
            </div>;
          })}
        </nav>

        <div className="flex flex-col justify-between gap-3 border-t border-slate-200/50 px-5 py-4 text-[9px] leading-6 text-slate-500 sm:flex-row sm:items-center sm:px-7 dark:border-white/10 dark:text-slate-400"><p className="max-w-xl">{briefingEdition.notice}</p><button type="button" onClick={collapse} className="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-600 hover:text-indigo-500 dark:text-slate-300">收起目录<ChevronDown size={13} className="rotate-180" /></button></div>
      </div>
      </AnimatedDisclosure>
      <p role="status" aria-live="polite" className="sr-only">{message}</p>
    </section>

    {selected && <dialog ref={dialog} aria-labelledby="daily-reading-title" onCancel={event => { event.preventDefault(); setSelectedId(null); }} onClick={event => { if (event.target === event.currentTarget) setSelectedId(null); }} className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-0 text-slate-800 shadow-2xl backdrop-blur-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm dark:border-white/15 dark:bg-slate-900/95 dark:text-slate-100">
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/60 px-6 py-4 sm:px-8 dark:border-white/10"><span className="text-[10px] tracking-[0.2em] text-indigo-500 dark:text-indigo-300">{briefingDisplay.title} / {categoryName(selected.category)} · {briefingEdition.date}</span><button type="button" autoFocus aria-label="关闭阅读窗口" onClick={() => setSelectedId(null)} className="rounded-xl bg-slate-100/80 p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-400 dark:bg-slate-800 dark:text-slate-300"><X size={18} /></button></div>
        <article aria-label="独立阅读内容" className="min-h-0 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-7">

              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]"><span className="font-mono tracking-[0.18em] text-indigo-500 dark:text-indigo-300">{categoryName(selected.category)}</span><span className="text-slate-400">原文 {selected.sourceDate}</span><span className="ml-auto text-slate-400">约 1 分钟</span></div>
              <h2 id="daily-reading-title" className="text-xl leading-relaxed text-slate-800 dark:text-white sm:text-2xl">{selected.title}</h2>
              <p className="mt-3 break-words text-[10px] leading-6 text-slate-500 dark:text-slate-400">{selected.originalTitle}</p>
              <p className="mt-2 text-[10px] text-slate-400">{selected.source}</p>
              <p className="mt-6 border-y border-slate-200/60 py-5 text-[13px] leading-8 text-slate-700 dark:border-white/10 dark:text-slate-200">{selected.summary}</p>
              <div className="mt-6 space-y-4">{selected.highlights.map((line, index) => <p key={line} className="flex gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><span className="mt-1 font-mono text-[9px] text-indigo-400">{pad(index + 1)}</span><span>{line}</span></p>)}</div>
              <div className="mb-6 mt-7 border-l border-pink-300 pl-4 dark:border-pink-400/50"><h3 className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">写在页边</h3><p className="text-xs leading-7 text-slate-500 dark:text-slate-400">{selected.readingNote}</p></div>
              <div className="flex flex-wrap gap-2">{selected.tags.map(tag => <span key={tag} className="text-[10px] text-indigo-500/80 dark:text-indigo-300/70">#{tag}</span>)}</div>
              {selected.doi && <p className="mt-3 break-all font-mono text-[9px] leading-5 text-slate-400">DOI {selected.doi}</p>}

              {briefingDisplay.showTerraNotes && terraNote && reading.terraNotes && <details key={selected.id} className="group/terra mt-6 border-t border-slate-200/60 pt-4 dark:border-white/10">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md py-2 text-[11px] text-slate-500 marker:hidden focus-visible:outline-2 focus-visible:outline-indigo-400 dark:text-slate-400"><Sparkles size={13} className="text-indigo-400" /><span>附加阅读</span><span className="text-[10px] text-slate-400">· 可选阅读</span><ChevronDown size={12} className="ml-auto transition-transform group-open/terra:rotate-180" /></summary>
                <div className="pb-2 pt-3 text-xs leading-7 text-slate-500 dark:text-slate-400">
                  <p className="mb-4 text-[10px] text-slate-400">从虚构情境借一个研究问题，以下为编辑联想。</p>
                  <dl className="space-y-4"><div><dt className="mb-1 text-[10px] font-medium text-indigo-500 dark:text-indigo-300">游戏情境 · 假想</dt><dd>{terraNote.scenario}</dd></div><div><dt className="mb-1 text-[10px] font-medium text-slate-600 dark:text-slate-300">回到真实研究</dt><dd>{terraNote.researchQuestion}</dd></div><div><dt className="mb-1 text-[10px] font-medium text-slate-600 dark:text-slate-300">类比边界</dt><dd>{terraNote.boundary}</dd></div></dl>
                  {terraNote.reference && <a href={terraNote.reference.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:underline dark:text-indigo-300">{terraNote.reference.label}<ArrowUpRight size={11} /></a>}
                </div>
              </details>}

        </article>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200/60 bg-white/70 px-6 py-4 sm:px-8 dark:border-white/10 dark:bg-slate-900/90"><button type="button" aria-pressed={reading.saved.includes(selected.id)} onClick={() => toggleSaved(selected.id)} className="flex items-center gap-2 py-1 text-[11px] text-slate-500 transition hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"><Bookmark size={14} fill={reading.saved.includes(selected.id) ? 'currentColor' : 'none'} />{reading.saved.includes(selected.id) ? '已收藏' : '留着慢慢读'}</button><a href={selected.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 border-b border-indigo-300/70 py-1 text-xs font-bold text-indigo-600 transition hover:border-indigo-600 dark:text-indigo-300">查看原文<ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a></div>
      </div>
    </dialog>}
  </>);
}

function AnimatedDisclosure({ open, children }: { open: boolean; children: ReactNode }) {
  return <div aria-hidden={!open} inert={!open} data-disclosure-state={open ? 'open' : 'closed'} style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }} className="grid transition-[grid-template-rows,opacity] duration-500 ease-in-out motion-reduce:transition-none">
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>;
}

function pad(value: number) { return String(value).padStart(2, '0'); }
function scrollBehavior(): ScrollBehavior { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
