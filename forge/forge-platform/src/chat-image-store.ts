import { createHash } from 'node:crypto';
import { ChatAttachmentError, validateChatImages, type ChatImage } from './chat-attachments';

const MAX_BYTES=50*1024*1024,MAX_IMAGES=1000;
const marker='\n\nAttached image identities (untrusted filenames; image pixels are supplied separately):\n';
const fail=(code:string,status=404):never=>{throw new ChatAttachmentError(code,status);};
/** Original bytes belong to a message, not the disposable model context. */
export function createChatImageStore(db:any){
 db.exec(`CREATE TABLE IF NOT EXISTS chat_message_images(
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sha256 TEXT NOT NULL,media_type TEXT NOT NULL,content BLOB NOT NULL,
  PRIMARY KEY(message_id,sha256));
  CREATE INDEX IF NOT EXISTS chat_message_images_owner ON chat_message_images(user_id);`);
 const quota=(user:string,images:ChatImage[])=>{
  const bytes=images.reduce((n,i)=>n+Buffer.byteLength(i.data,'base64'),0);
  const current=db.prepare('SELECT COUNT(*) n,COALESCE(SUM(length(content)),0) bytes FROM chat_message_images WHERE user_id=?').get(user);
  if(current.n+images.length>MAX_IMAGES||current.bytes+bytes>MAX_BYTES)fail('CHAT_IMAGE_STORAGE_LIMIT',413);
 };
 const save=db.transaction((user:string,thread:string,message:string,images:ChatImage[])=>{
  if(!images.length)return;
  if(!db.prepare("SELECT m.id FROM messages m JOIN threads t ON t.id=m.thread_id WHERE m.id=? AND m.thread_id=? AND t.user_id=? AND m.role='user'").get(message,thread,user))fail('CHAT_IMAGE_NOT_FOUND');
  quota(user,images);
  for(const image of images){const bytes=Buffer.from(image.data,'base64'),hash=createHash('sha256').update(bytes).digest('hex');db.prepare('INSERT INTO chat_message_images(message_id,thread_id,user_id,sha256,media_type,content) VALUES(?,?,?,?,?,?) ON CONFLICT(message_id,sha256) DO NOTHING').run(message,thread,user,hash,image.mimeType,bytes);}
 });
 const get=(user:string,thread:string,message:string,hash:string)=>{
  if(!/^[a-f0-9]{64}$/.test(hash))fail('CHAT_IMAGE_NOT_FOUND');
  const owned=db.prepare("SELECT m.content FROM messages m JOIN threads t ON t.id=m.thread_id WHERE m.id=? AND m.thread_id=? AND t.user_id=? AND m.role='user'").get(message,thread,user);
  if(!owned)fail('CHAT_IMAGE_NOT_FOUND');
  const saved=db.prepare('SELECT media_type,content FROM chat_message_images WHERE message_id=? AND thread_id=? AND user_id=? AND sha256=?').get(message,thread,user,hash);
  if(saved)return {mediaType:saved.media_type,data:Buffer.from(saved.content).toString('base64'),sha256:hash,bytes:saved.content.length};
  if(db.prepare('SELECT 1 FROM chat_message_images WHERE message_id=? LIMIT 1').get(message))fail('CHAT_IMAGE_NOT_FOUND');
  // Read compatibility for images submitted before original-byte persistence.
  // A matching marker alone cannot grant access to another message or account.
  const at=owned.content.lastIndexOf(marker);if(at<0)fail('CHAT_IMAGE_NOT_FOUND');
  let identities:any;try{identities=JSON.parse(owned.content.slice(at+marker.length).split('\n')[0]);}catch{fail('CHAT_IMAGE_NOT_FOUND');}
  if(!Array.isArray(identities)||!identities.some((i:any)=>i.sha256===hash))fail('CHAT_IMAGE_NOT_FOUND');
  const find=(raw:string)=>{
   let session:any;try{session=JSON.parse(raw);}catch{return;}
   for(const entry of session?.entries||[]){if(entry.type!=='message'||entry.message?.role!=='user'||!Array.isArray(entry.message.content))continue;
    if(!entry.message.content.some((part:any)=>part.type==='text'&&typeof part.text==='string'&&part.text.includes(owned.content)))continue;
    for(const image of entry.message.content){if(image.type!=='image')continue;
     try{const checked=validateChatImages([{type:'image',data:image.data,mediaType:image.mimeType}])[0],bytes=Buffer.from(checked.data,'base64');if(createHash('sha256').update(bytes).digest('hex')===hash)return {mediaType:checked.mimeType,data:checked.data,sha256:hash,bytes:bytes.length};}catch{}
    }
   }
  };
  const current=db.prepare('SELECT session_json FROM pi_thread_sessions WHERE thread_id=? AND user_id=?').get(thread,user);
  const active=current?.session_json&&find(current.session_json);if(active)return active;
  for(const archive of db.prepare('SELECT session_json FROM pi_thread_archives WHERE thread_id=? AND user_id=? ORDER BY created_at DESC').iterate(thread,user)){const found=find(archive.session_json);if(found)return found;}
  return fail('CHAT_IMAGE_ORIGINAL_UNAVAILABLE');
 };
 const messageImages=(user:string,thread:string,message:string):ChatImage[]=>{
  const row=db.prepare("SELECT m.content FROM messages m JOIN threads t ON t.id=m.thread_id WHERE m.id=? AND m.thread_id=? AND t.user_id=? AND m.role='user'").get(message,thread,user);
  if(!row)fail('CHAT_IMAGE_NOT_FOUND');
  const stored=db.prepare('SELECT sha256 FROM chat_message_images WHERE message_id=? AND thread_id=? AND user_id=? ORDER BY rowid').all(message,thread,user);
  let hashes:string[]=stored.map((item:any)=>item.sha256);
  if(!hashes.length){const at=row.content.lastIndexOf(marker);if(at>=0){let identities:any;try{identities=JSON.parse(row.content.slice(at+marker.length).split('\n')[0]);}catch{}
   if(Array.isArray(identities)&&identities.length<=4&&identities.every((item:any)=>typeof item?.sha256==='string'&&/^[a-f0-9]{64}$/.test(item.sha256)))hashes=[...new Set<string>(identities.map((item:any)=>item.sha256))];
  }}
  return hashes.map(hash=>{const image=get(user,thread,message,hash);return {type:'image',data:image.data,mimeType:image.mediaType};});
 };
 const copyMessage=(user:string,sourceThread:string,sourceMessage:string,targetThread:string,targetMessage:string)=>save(user,targetThread,targetMessage,messageImages(user,sourceThread,sourceMessage));
 const saveNative=(user:string,thread:string,message:string,parts:any[])=>save(user,thread,message,validateChatImages(parts.filter(part=>part?.type==='image').map(part=>({type:'image',data:part.data,mediaType:part.mimeType}))));
 const history=(user:string,thread:string,messages:any[])=>messages.map(message=>{
  if(message.role!=='user')return {role:message.role,content:message.content};
  const images=messageImages(user,thread,message.id);
  return {role:'user',content:images.length?[{type:'text',text:message.content},...images]:message.content};
 });
 return {save,get,quota,copyMessage,saveNative,history};
}
export function registerChatImageRoutes(app:any,auth:any,rateLimit:any,store:ReturnType<typeof createChatImageStore>){
 app.get('/api/threads/:thread/messages/:message/images/:hash',auth,rateLimit,(req:any,res:any)=>{
  res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');
  try{res.json({success:true,data:store.get(req.user.sub,req.params.thread,req.params.message,req.params.hash)});}
  catch(error){res.status(error instanceof ChatAttachmentError?error.status:500).json({success:false,error:error instanceof ChatAttachmentError?error.code:'CHAT_IMAGE_READ_FAILED'});}
 });
}
