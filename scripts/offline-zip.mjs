import fs from 'node:fs/promises';
import {deflateRawSync,crc32} from 'node:zlib';

/** Standard UTF-8 ZIP, deflate compression and CRC checks; no external archiver required. */
export async function writeOfflineZip(target,entries){
 const file=await fs.open(target,'w'),central=[];let offset=0;
 try{
  for(const entry of entries){
   if(!entry.name||entry.name.includes('..')||entry.name.startsWith('/')||entry.name.includes('\\'))throw Error('Invalid ZIP path');
   const data=entry.data??await fs.readFile(entry.path),name=Buffer.from(entry.name),compressed=deflateRawSync(data,{level:6});
   const method=compressed.length<data.length?8:0,body=method?compressed:data,crc=crc32(data);
   const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
   const header=Buffer.alloc(46);header.writeUInt32LE(0x02014b50);header.writeUInt16LE(20,4);header.writeUInt16LE(20,6);header.writeUInt16LE(0x800,8);header.writeUInt16LE(method,10);header.writeUInt32LE(crc,16);header.writeUInt32LE(body.length,20);header.writeUInt32LE(data.length,24);header.writeUInt16LE(name.length,28);header.writeUInt32LE(offset,42);
   await file.write(local);await file.write(name);await file.write(body);central.push(header,name);offset+=local.length+name.length+body.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  await file.write(directory);await file.write(end);
 }finally{await file.close();}
}
