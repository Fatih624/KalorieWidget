import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
import Coach from './coach';
export const dynamic = 'force-dynamic';
export default async function Home() { const user = await getChatGPTUser(); if (!user) return <main className="login glass"><span className="brand-symbol">✦</span><p className="eyebrow">KALORIE COACH</p><h1>Dein Tag.<br/>Dein gutes Gefühl.</h1><p>Deine Mahlzeiten, Makros und Favoriten. Privat und auf allen deinen Geräten.</p><a className="primary" target="_top" href={chatGPTSignInPath('/')}>Mit ChatGPT anmelden →</a></main>; return <Coach name={user.fullName?.split(' ')[0] || ''} userKey={user.userId}/>; }
