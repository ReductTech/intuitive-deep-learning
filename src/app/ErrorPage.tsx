import {useEffect} from 'react';
import {SiteHeader} from '../shuku/SiteHeader';
import {requestSignIn} from '../shuku/guest';
import {errorReport} from './errorReport';
import './ErrorPage.css';

interface ErrorPageProps {
  error?: unknown;
  status?: number;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorPage({error, status, onRetry = () => location.reload(), retrying = false}: ErrorPageProps) {
  const report = errorReport(error, status);
  useEffect(() => {
    const previous = document.title;
    document.title = `${report.title} · 术库`;
    return () => { document.title = previous; };
  }, [report.title]);
  const back = () => {
    if (window.history.length > 1) window.history.back();
    else location.assign('/');
  };
  return <div className="sd-library shuku-error-page">
    <SiteHeader section="courses"/>
    <main className="shuku-error-main" aria-labelledby="shuku-error-title">
      <div className="shuku-error-summary">
      <div className="shuku-error-code" aria-hidden="true">{report.code}</div>
      <span className="shuku-error-mark" aria-hidden="true"/>
      <h1 id="shuku-error-title">{report.title}</h1>
      <p className="shuku-error-description">{report.description}</p>
      <div className="shuku-error-actions">
        {report.code === '401'
          ? <button className="is-primary" onClick={requestSignIn}>重新登录</button>
          : report.retryable
            ? <button className="is-primary" disabled={retrying} onClick={onRetry}>{retrying ? '正在重试…' : '重新尝试'}</button>
            : <a className="is-primary" href="/">返回术库</a>}
        {report.retryable || report.code === '401' ? <a href="/">返回术库</a> : <button onClick={back}>返回上一页</button>}
      </div>
      <section className="shuku-error-details" aria-label="具体错误原因">
        <h2>具体原因 <span>{report.code === '离线' ? '网络错误' : /^\d+$/.test(report.code) ? `HTTP ${report.code}` : '页面错误'}</span></h2>
        <p>{report.reason}</p>
      </section>
      </div>
    </main>
  </div>;
}
