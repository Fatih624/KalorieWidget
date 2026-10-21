import { getChatGPTUser } from './chatgpt-auth';
import { browserOwner, passwordEnabled } from '../lib/password-auth';
import PasswordLogin from './password-login';
import Coach from './coach';
export const dynamic='force-dynamic';
export default async function Home(){
 const owner=await browserOwner();
 if(owner)return <Coach name="Fatih" userKey={owner}/>;
 if(passwordEnabled())return <PasswordLogin/>;
 const user=await getChatGPTUser();
 if(user)return <Coach name={user.fullName?.split(' ')[0]||'Fatih'} userKey={user.userId}/>;
 return <PasswordLogin/>;
}
