export interface ErrorReport {
  code: string;
  title: string;
  description: string;
  reason: string;
  retryable: boolean;
}

const messages: Record<number, [string, string]> = {
  400: ['请求信息有误', '请检查链接或输入的内容后再试。'],
  401: ['需要重新登录', '请登录后再访问这个页面。'],
  403: ['暂时无法访问', '当前账号没有访问这项内容的权限。'],
  404: ['页面没有找到', '这个页面可能已移动，或链接有误。'],
  410: ['内容已移除', '这项内容已下线，可以返回术库浏览其他课程。'],
  429: ['访问有些频繁', '请稍等片刻，再重新尝试。'],
  500: ['服务暂时出了点问题', '请稍后重试，或返回术库继续浏览。'],
  502: ['暂时无法连接服务', '服务连接暂时中断，请稍后再试。'],
  503: ['服务暂时不可用', '服务可能正在维护或繁忙，请稍后重试。'],
  504: ['服务响应超时', '等待服务响应的时间过长，请稍后重试。'],
};

/** Keep the original failure reason separate from the friendly page summary. */
export function errorReport(error?: unknown, status?: number): ErrorReport {
  const value = error && typeof error === 'object' ? error as { status?: unknown; message?: unknown; name?: unknown } : undefined;
  const rawStatus = status ?? value?.status;
  const httpStatus = typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : undefined;
  const network = rawStatus === 0 || (!httpStatus && value?.name === 'TypeError' && /fetch|network|网络/i.test(String(value.message)));
  const reason = typeof error === 'string' ? error : typeof value?.message === 'string' ? value.message : '';
  const [title, description] = network
    ? ['网络连接异常', '请检查网络连接，然后重新尝试。']
    : httpStatus && messages[httpStatus] || ['页面暂时无法显示', '遇到了一些问题，请重试或返回术库。'];
  return {
    code: network ? '离线' : String(httpStatus ?? '异常'),
    title, description,
    reason: reason.trim() || (httpStatus === 404 ? '没有找到与当前链接对应的页面。' : description),
    retryable: network || !httpStatus || httpStatus === 429 || httpStatus >= 500,
  };
}
