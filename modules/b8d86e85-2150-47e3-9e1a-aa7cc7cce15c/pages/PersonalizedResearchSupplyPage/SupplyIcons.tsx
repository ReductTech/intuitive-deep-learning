import type { SVGProps, ReactNode } from 'react';
type Props=SVGProps<SVGSVGElement>;
function Icon({children,...props}:Props&{children:ReactNode}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>;}
export function ArrowRight(props:Props){return <Icon {...props}><path d="M3 12h17m-6-6 6 6-6 6"/></Icon>;}
export function ArrowDown(props:Props){return <Icon {...props}><path d="M12 3v17m-6-6 6 6 6-6"/></Icon>;}
export function Clock3(props:Props){return <Icon {...props}><circle cx="12" cy="12" r="9.5"/><path d="M12 6v6h5"/></Icon>;}
export function Brain(props:Props){return <Icon {...props}><path d="M8 21v-4l-3-1v-4H3l2-4c0-8 15-8 15 1 0 4-3 6-3 8v4M9 6c-3 0-3 5 0 5m0-5c0-3 5-3 5 0m0 0c4-2 6 4 2 5m-7 0c1 3 6 3 7 0M9 6v3h3m2-3v3h2m-4 0v4"/></Icon>;}
export function FileSearch(props:Props){return <Icon {...props}><path d="M13 21H4V3h11l4 4v5M14 3v5h5M7 11h5M7 15h4"/><circle cx="17" cy="17" r="4" stroke="var(--ui-accent-alt)"/><path d="m20 20 3 3" stroke="var(--ui-accent-alt)"/></Icon>;}
export function ChartColumnIncreasing(props:Props){return <Icon {...props}><rect x="3" y="15" width="4" height="7" rx=".5" fill="var(--ui-accent)" stroke="none"/><rect x="10" y="9" width="4" height="13" rx=".5" fill="var(--ui-accent)" stroke="none"/><rect x="17" y="2" width="4" height="20" rx=".5" fill="var(--ui-accent-alt)" stroke="none"/></Icon>;}
export function UserRound(props:Props){return <Icon {...props}><circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2Z"/></Icon>;}
export function UserRoundCog(props:Props){return <Icon {...props}><circle cx="10" cy="6" r="4" fill="currentColor" stroke="none"/><path d="M2 21v-3a8 8 0 0 1 12-7"/><g stroke="var(--ui-accent-alt)"><circle cx="18" cy="17" r="4"/><circle cx="18" cy="17" r="1.2"/><path d="M18 11v2m0 8v2m-6-6h2m8 0h2m-10-4 1.5 1.5m5 5L22 21m-8 0 1.5-1.5m5-5L22 13"/></g></Icon>;}
