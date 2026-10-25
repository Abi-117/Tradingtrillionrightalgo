import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, FileBarChart2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { site } from '@/config/site';

export function LatestReports() {
  const query = useQuery({queryKey: ['reports'], queryFn: reportService.list, enabled: Boolean(site.apiBaseUrl), retry: false});
  const reports = [...(query.data ?? [])].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  if (reports.length) return <div className="report-grid">{reports.map(report=><article className="report-card" key={report.id}><Link to="/daily-report"><img src={report.imageUrl} alt={report.title} loading="lazy" width={400} height={300}/></Link><div><span className="eyebrow">{report.category}</span><h3>{report.title}</h3><time dateTime={report.date}>{report.date}</time><p>{report.description}</p></div></article>)}</div>;
  return <div className="home-reports-empty"><FileBarChart2 size={34}/><h3>{query.isLoading ? 'Loading reports…' : query.isError ? 'Reports are temporarily unavailable.' : 'No reports available yet.'}</h3><p>{query.isError ? 'Please try the report gallery again later.' : 'Published daily reports will appear here.'}</p><Link to="/daily-report" className="text-link">Explore the report gallery<ArrowRight size={16}/></Link></div>;
}