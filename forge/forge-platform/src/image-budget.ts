import { imageSize } from 'image-size';

/** Verified 2026-09-21 against OpenAI's images-vision sizing/token rules.
 * This authorizes a conservative reservation, never a final usage charge.
 * https://developers.openai.com/api/docs/guides/images-vision */
export const IMAGE_BUDGET_POLICY = 'openai_patch_32_multiplier_1_2_20260921';
const verifiedModels = new Set(['openai/gpt-6-astra','openai/gpt-5.6-sol','openai/gpt-5.6-terra','openai/gpt-5.6-luna']);
export const supportsManagedImages = (model:string) => verifiedModels.has(model);
const fail=(code:string):never=>{throw Object.assign(new Error(code),{code,statusCode:400});};

function assertStillImage(bytes:Buffer,type:string) {
  if(type==='gif') {
    let offset=13,frames=0;
    if(bytes[10]&128)offset+=3*(1<<((bytes[10]&7)+1));
    const blocks=()=>{while(offset<bytes.length){const size=bytes[offset++];if(!size)return;offset+=size;if(offset>bytes.length)fail('CHAT_IMAGES_INVALID');}fail('CHAT_IMAGES_INVALID');};
    while(offset<bytes.length){
      const block=bytes[offset++];
      if(block===0x3b){if(frames!==1)fail('CHAT_IMAGES_INVALID');return;}
      if(block===0x21){offset++;blocks();}
      else if(block===0x2c){
        if(++frames>1)fail('CHAT_IMAGE_ANIMATION_UNSUPPORTED');
        if(offset+9>bytes.length)fail('CHAT_IMAGES_INVALID');
        const flags=bytes[offset+8];offset+=9;
        if(flags&128)offset+=3*(1<<((flags&7)+1));
        offset++;blocks();
      }else fail('CHAT_IMAGES_INVALID');
    }
    fail('CHAT_IMAGES_INVALID');
  }
  if(type==='webp'&&bytes.subarray(12,16).toString()==='VP8X'&&(bytes[20]&2))fail('CHAT_IMAGE_ANIMATION_UNSUPPORTED');
  if(type==='png')for(let offset=8;offset+12<=bytes.length;){
    const length=bytes.readUInt32BE(offset),kind=bytes.subarray(offset+4,offset+8).toString();
    if(length>bytes.length-offset-12)fail('CHAT_IMAGES_INVALID');
    if(kind==='acTL')fail('CHAT_IMAGE_ANIMATION_UNSUPPORTED');
    offset+=length+12;if(kind==='IEND')break;
  }
}

export function inspectInlineImage(url:unknown) {
  if(typeof url!=='string'||url.length>3*1024*1024)fail('CHAT_IMAGES_INVALID');
  const match=/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(url as string);
  if(!match)fail('CHAT_IMAGES_INVALID');
  const bytes=Buffer.from(match![2],'base64');
  if(!bytes.length||bytes.length>2*1024*1024||bytes.toString('base64')!==match![2])fail('CHAT_IMAGES_INVALID');
  let dimensions:ReturnType<typeof imageSize>;
  try{dimensions=imageSize(bytes);}catch{fail('CHAT_IMAGES_INVALID');}
  if(dimensions!.type!==({jpeg:'jpg'} as Record<string,string>)[match![1]]&&dimensions!.type!==match![1])fail('CHAT_IMAGES_INVALID');
  const {width,height}=dimensions!;
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>65535||height>65535)fail('CHAT_IMAGE_DIMENSIONS_UNSUPPORTED');
  assertStillImage(bytes,match![1]);
  return {width,height,bytes:bytes.length};
}

export function imageTokenUpperBound(model:string,width:number,height:number,detail:unknown='auto') {
  if(!supportsManagedImages(model))fail('CHAT_MODEL_IMAGES_UNSUPPORTED');
  if(!['auto','original','high','low'].includes(String(detail)))fail('CHAT_IMAGE_DETAIL_UNSUPPORTED');
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>65535||height>65535)fail('CHAT_IMAGE_DIMENSIONS_UNSUPPORTED');
  // Using original patch coverage is conservative when a detail level resizes
  // an image. The documented high/low ceilings bound the resized coverage.
  let patches=Math.ceil(width/32)*Math.ceil(height/32);
  if(detail==='low')patches=Math.min(patches,256);
  if(detail==='high')patches=Math.min(patches,2500);
  if(patches>30000)fail('CHAT_IMAGE_DIMENSIONS_UNSUPPORTED');
  // Integer arithmetic plus the documented possible one-token rounding drift.
  return Math.ceil(patches*6/5)+1;
}

/** Count every image in the provider request, including native conversation
 * history. Base64 is a transport encoding and must not be charged as text.
 * Other input fields remain in the conservative UTF-8 byte estimate. */
export function estimateManagedInput(model:string,body:any) {
  let imageTokens=0,imageCount=0,imageBytes=0;
  const messages=body.messages?.map((message:any)=>{
    if(!Array.isArray(message.content))return message;
    return {...message,content:message.content.map((part:any)=>{
      if(part?.type==='text'&&typeof part.text==='string')return part;
      if(part?.type!=='image_url'||!part.image_url||typeof part.image_url!=='object')fail('PI_MANAGED_MULTIMODAL_BUDGET_UNSUPPORTED');
      const image=inspectInlineImage(part.image_url.url);
      if(++imageCount>32||(imageBytes+=image.bytes)>6*1024*1024)fail('CHAT_IMAGES_TOO_LARGE');
      imageTokens+=imageTokenUpperBound(model,image.width,image.height,part.image_url.detail??'auto');
      return {...part,image_url:{...part.image_url,url:'[inline image bytes excluded from text estimate]'}};
    })};
  });
  const textBytes=Buffer.byteLength(JSON.stringify({...body,messages}),'utf8');
  return {inputTokens:textBytes+imageTokens+1024,textBytes,imageTokens,imageCount,policy:IMAGE_BUDGET_POLICY};
}
