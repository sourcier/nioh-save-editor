// Standalone script to decrypt the save and inspect offset values
// Usage: node tools/inspect-offsets.mjs <path-to-save>
import { readFileSync } from 'fs'

// ── Crypto constants ───────────────────────────────────────────────────────────
const SBOX = new Uint8Array([
  0x1C,0x2F,0x03,0x53,0xA3,0x01,0x49,0xDA,0xA6,0xCD,0xE0,0x8A,0x19,0xA7,0x04,0xD4,
  0x06,0x1A,0xDA,0x49,0x08,0xE2,0xF6,0xB2,0x9E,0xE1,0x22,0x49,0xCE,0x7B,0x7E,0x5E,
  0xA0,0x09,0x2A,0x63,0xAF,0x49,0xCE,0x70,0x7B,0x3C,0x23,0x80,0xFA,0x17,0x47,0xF2,
  0x62,0x62,0x6C,0x59,0x10,0xCC,0x29,0x9C,0xB5,0x46,0x58,0xC7,0x44,0x13,0xE7,0x38,
  0xD5,0xAF,0x27,0x83,0xD4,0xD5,0xA0,0x9E,0xE3,0x76,0x3B,0x85,0x04,0xD9,0xD6,0x98,
  0x60,0x66,0xD4,0x78,0x53,0xEA,0xCA,0x0E,0x8D,0x56,0x53,0x44,0xE2,0xEF,0xBD,0xA9,
  0x9B,0x10,0x0A,0xA1,0x13,0x93,0xF0,0x43,0x0B,0x7C,0x39,0x8A,0x47,0xDF,0xD3,0xC5,
  0x0E,0x34,0x31,0xA6,0xAE,0x5A,0xB8,0xE7,0xE6,0x31,0x43,0xC0,0xAA,0x0F,0xE0,0x82,
  0x12,0x4C,0xD1,0xDF,0x8B,0xA5,0xAC,0x70,0xC5,0x3D,0x1B,0x8E,0x93,0x17,0x4D,0x79,
  0x4E,0xCE,0x63,0xC4,0x33,0x0E,0x14,0x57,0xF0,0xD8,0x19,0x5B,0x9B,0x61,0x71,0xF2,
  0x2B,0x33,0x7E,0xFD,0x2C,0x0B,0xB6,0x23,0x20,0xB9,0xD4,0x91,0x19,0x94,0x04,0xA4,
  0x30,0x13,0x8A,0xF1,0xD0,0x05,0xEC,0x5E,0xAC,0x4A,0xD4,0xD6,0xA5,0x17,0x7F,0xF9,
  0xE5,0xF6,0x00,0x29,0xD7,0x93,0x2D,0x5E,0x2C,0xF1,0x81,0xA3,0xB7,0x63,0x39,0x57,
  0xC2,0x33,0x87,0x2D,0xA8,0x3F,0x02,0xCC,0x08,0x67,0x74,0x60,0xD8,0xF0,0xDA,0x67,
  0x40,0x64,0x87,0x55,0xBB,0x7F,0xF2,0x10,0xC9,0x03,0x14,0xB5,0x80,0x66,0xCB,0x91,
  0xF6,0x1F,0x79,0x58,0x88,0xBC,0x95,0xC2,0x06,0x5F,0xE9,0x09,0x32,0xED,0x9B,0x85,
])
const RCON = new Uint8Array([0x8d,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36])
const ROOT_CRYPTO_BLOB = new Uint8Array([
  0x54,0x19,0x31,0x3E,0xF4,0x6B,0xE4,0x24,0xCD,0xA7,0x96,0x6F,0xAB,0xF0,0x69,0xCA,
  0x00,0x00,0x80,0xBF,0xEC,0x3B,0x9D,0xA1,0x46,0x0C,0xDD,0x33,0xF3,0xD2,0x58,0xE0,
  0xC0,0x9F,0xC7,0xD4,0xF6,0xEF,0xDC,0x70,0x92,0x6F,0x52,0xD8,0xF1,0xBD,0x54,0x36,
  0xA2,0xCB,0xAC,0xA3,0x99,0xFC,0xC8,0xD2,0xA9,0x61,0x72,0x6B,0xD7,0x8D,0x15,0xB8,
  0x80,0xAC,0xA0,0xB5,0x9A,0xA0,0xEE,0x1E,0x8B,0xF5,0xD9,0xDA,0x2C,0x92,0xAE,0xB4,
  0x9D,0x92,0xE0,0x79,0xAA,0x76,0x55,0x31,0xBC,0xE3,0x02,0x00,0x7A,0xB9,0x53,0x7F,
  0xE2,0x60,0xF5,0x26,0x2B,0x1E,0x7D,0xA7,0x5D,0xD1,0xBD,0x84,0x23,0x3B,0xE4,0x32,
  0x33,0x03,0xA4,0x81,0x84,0x98,0x97,0xAB,0x63,0x7A,0x82,0x25,0x39,0x9F,0xC0,0x73,
  0x49,0x63,0x94,0xFD,0xD8,0xDE,0xA8,0xC8,0xB0,0x36,0x52,0xCD,0x07,0xD6,0xA2,0x0A,
  0xF2,0x00,0x8C,0x62,
])
const Nb = 4, Nk = 4, Nr = 10, BLOCK = 16
const HEADER_SIZE = 0x148

function xtime(x) { return ((x << 1) ^ (((x >> 7) & 1) * 0x1b)) & 0xff }

function keyExpansion(key) {
  const rk = new Uint8Array((Nr + 1) * Nb * 4)
  for (let i = 0; i < Nk; i++) {
    rk[i*4+0]=key[i*4+3]; rk[i*4+1]=key[i*4+2]; rk[i*4+2]=key[i*4+1]; rk[i*4+3]=key[i*4+0]
  }
  const temp = new Uint8Array(4)
  for (let i = Nk; i < Nb*(Nr+1); i++) {
    temp.set(rk.subarray((i-1)*4, i*4))
    if (i % Nk === 0) {
      const k=temp[0]; temp[0]=temp[1]; temp[1]=temp[2]; temp[2]=temp[3]; temp[3]=k
      temp[0]=SBOX[temp[0]]; temp[1]=SBOX[temp[1]]; temp[2]=SBOX[temp[2]]; temp[3]=SBOX[temp[3]]
      temp[0] ^= RCON[i/Nk]
    }
    rk[i*4+0]=rk[(i-Nk)*4+0]^temp[0]; rk[i*4+1]=rk[(i-Nk)*4+1]^temp[1]
    rk[i*4+2]=rk[(i-Nk)*4+2]^temp[2]; rk[i*4+3]=rk[(i-Nk)*4+3]^temp[3]
  }
  return rk
}

function aesEcbEncrypt(block, key) {
  const rk = keyExpansion(key)
  const state = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]
  for (let col=0;col<4;col++) for (let row=0;row<4;row++) state[col][row]=block[col*4+row]
  function addRK(round) {
    for (let col=0;col<4;col++) for (let row=0;row<4;row++) state[col][row]^=rk[(round*Nb+col)*4+row]
  }
  function subB() { for(let i=0;i<4;i++) for(let j=0;j<4;j++) state[j][i]=SBOX[state[j][i]] }
  function shiftR() {
    let t
    t=state[0][1];state[0][1]=state[1][1];state[1][1]=state[2][1];state[2][1]=state[3][1];state[3][1]=t
    t=state[0][2];state[0][2]=state[2][2];state[2][2]=t; t=state[1][2];state[1][2]=state[3][2];state[3][2]=t
    t=state[0][3];state[0][3]=state[3][3];state[3][3]=state[2][3];state[2][3]=state[1][3];state[1][3]=t
  }
  function mixC() {
    for(let i=0;i<4;i++) {
      const t=state[i][0], Tmp=state[i][0]^state[i][1]^state[i][2]^state[i][3]
      let Tm
      Tm=xtime(state[i][0]^state[i][1]);state[i][0]^=Tm^Tmp
      Tm=xtime(state[i][1]^state[i][2]);state[i][1]^=Tm^Tmp
      Tm=xtime(state[i][2]^state[i][3]);state[i][2]^=Tm^Tmp
      Tm=xtime(state[i][3]^t);          state[i][3]^=Tm^Tmp
    }
  }
  addRK(0)
  for(let r=1;r<Nr;r++){subB();shiftR();mixC();addRK(r)}
  subB();shiftR();addRK(Nr)
  const out=new Uint8Array(BLOCK)
  for(let col=0;col<4;col++) for(let row=0;row<4;row++) out[col*4+row]=state[col][row]
  return out
}

function flip32(arr) {
  for(let i=0;i<4;i++){const a=arr[4*i],b=arr[4*i+1],c=arr[4*i+2],d=arr[4*i+3];arr[4*i]=d;arr[4*i+1]=c;arr[4*i+2]=b;arr[4*i+3]=a}
}
function incrArr(arr,incr=0){
  if(incr>=arr.length)return
  const idx=arr.length-incr-1
  if(arr[idx]===0xff){arr[idx]=0x00;incrArr(arr,incr+1)}else{arr[idx]++}
}
function deconstructRootKeyPair(type,blob){
  const buf=new Uint8Array(32),rk=new Uint8Array(BLOCK),riv=new Uint8Array(BLOCK)
  if(type==='HEADER'){
    for(let i=0;i<4;i++){
      const c1=blob[8+i],c2=blob[0+i],c3=blob[12+i],c4=blob[4+i]
      buf[0+i]=c1^blob[20+i]; buf[4+i]=c2^blob[24+i]; buf[8+i]=c3^blob[28+i]; buf[12+i]=c4^blob[32+i]
      buf[16+i]=c1^blob[36+i]; buf[20+i]=c2^blob[40+i]; buf[24+i]=c3^blob[44+i]; buf[28+i]=c4^blob[48+i]
    }
    rk.set(buf.subarray(0,BLOCK)); riv.set(buf.subarray(BLOCK,BLOCK*2))
  } else {
    for(let i=0;i<4;i++){
      const c1=blob[0+i],c2=blob[8+i],c3=blob[12+i],c4=blob[56+i],c5=blob[52+i],c6=blob[60+i],c7=blob[4+i]
      buf[0+i]=c2^blob[68+i]; buf[4+i]=c1^blob[72+i]; buf[8+i]=c3^blob[76+i]; buf[12+i]=c7^blob[80+i]
      buf[16+i]=c2^c5; buf[20+i]=c1^c4; buf[24+i]=c3^c6; buf[28+i]=c7^blob[64+i]
    }
    riv.set(buf.subarray(0,BLOCK)); rk.set(buf.subarray(BLOCK,BLOCK*2))
  }
  flip32(rk)
  return {rootKey:rk,rootIV:riv}
}
function keySetup(type,blob,saveClear){
  const {rootKey,rootIV}=deconstructRootKeyPair(type,blob)
  const sk1=new Uint8Array(BLOCK),siv1=new Uint8Array(BLOCK),sk2=new Uint8Array(BLOCK),siv2=new Uint8Array(BLOCK)
  if(type==='HEADER'){
    sk1.set(blob.subarray(84,100)); siv1.set(blob.subarray(116,132)); sk2.set(blob.subarray(100,116)); siv2.set(blob.subarray(132,148))
  } else {
    sk1.set(saveClear.subarray(0x40,0x50)); siv1.set(saveClear.subarray(0x50,0x60)); sk2.set(saveClear.subarray(0x60,0x70)); siv2.set(saveClear.subarray(0x70,0x80))
  }
  const o1=aesEcbEncrypt(rootIV,rootKey); for(let i=0;i<BLOCK;i++) sk1[i]^=o1[i]; flip32(sk1)
  const o2=aesEcbEncrypt(rootIV,rootKey); for(let i=0;i<BLOCK;i++) siv1[i]^=o2[i]
  const o3=aesEcbEncrypt(siv1,sk1); for(let i=0;i<BLOCK;i++) sk2[i]^=o3[i]; flip32(sk2)
  const o4=aesEcbEncrypt(siv1,sk1); for(let i=0;i<BLOCK;i++) siv2[i]^=o4[i]
  return {sKey1:sk1,sIV1:siv1,sKey2:sk2,sIV2:siv2}
}
function ctrPass(src,dst,start,nRounds,iv,key){
  const ivL=new Uint8Array(iv)
  for(let i=0;i<nRounds;i++){
    const ks=aesEcbEncrypt(ivL,key); incrArr(ivL)
    for(let j=0;j<BLOCK;j++) dst[start+i*BLOCK+j]=src[start+i*BLOCK+j]^ks[j]
  }
}
function processHeader(encr,clear,sk1,siv1,sk2,siv2){
  const nR=Math.floor(HEADER_SIZE/BLOCK)+1
  const tmp=new Uint8Array(nR*BLOCK),tmp2=new Uint8Array(nR*BLOCK)
  ctrPass(encr,tmp,0,nR,siv2,sk2); ctrPass(tmp,tmp2,0,nR,siv1,sk1)
  clear.set(tmp2.subarray(0,HEADER_SIZE),0)
}
function processBody(encr,clear,sk1,siv1,sk2,siv2){
  const bodySize=encr.length-HEADER_SIZE,nR=Math.floor(bodySize/BLOCK)
  ctrPass(encr,clear,HEADER_SIZE,nR,siv2,sk2)
  const tmp=new Uint8Array(clear); ctrPass(tmp,clear,HEADER_SIZE,nR,siv1,sk1)
}
function niohDecrypt(input){
  const encr=new Uint8Array(input),clear=new Uint8Array(input.length)
  const {sKey1:hk1,sIV1:hiv1,sKey2:hk2,sIV2:hiv2}=keySetup('HEADER',ROOT_CRYPTO_BLOB)
  processHeader(encr,clear,hk1,hiv1,hk2,hiv2)
  const {sKey1,sIV1,sKey2,sIV2}=keySetup('BODY',ROOT_CRYPTO_BLOB,clear)
  processBody(encr,clear,sKey1,sIV1,sKey2,sIV2)
  return Buffer.from(clear)
}

// ── Read & decrypt ─────────────────────────────────────────────────────────────
const savePath = process.argv[2]
if (!savePath) { console.error('Usage: node inspect-offsets.mjs <save-path>'); process.exit(1) }

const raw = readFileSync(savePath)
const isAlreadyDecrypted = raw[0]===0x4e&&raw[1]===0x49&&raw[2]===0x4f&&raw[3]===0x48
const buf = isAlreadyDecrypted ? raw : niohDecrypt(raw)

console.log(`File size: ${raw.length} (${isAlreadyDecrypted ? 'already decrypted' : 'decrypted now'})`)
console.log(`Magic: ${buf.slice(0,4).toString('ascii')}`)
console.log()

// ── Helper ─────────────────────────────────────────────────────────────────────
function readLE(offset, bytes=4) {
  let v = 0
  for (let i = 0; i < bytes; i++) v |= buf[offset+i] << (8*i)
  return v >>> 0
}
function hex(n) { return '0x' + n.toString(16).padStart(8,'0') }
function dump(label, offset) {
  const v = readLE(offset)
  console.log(`  ${label.padEnd(30)} offset=${hex(offset)}  value=${v}`)
}

// ── Known-good offsets (for sanity check) ─────────────────────────────────────
console.log('=== Sanity check (known values) ===')
dump('amrita (expect 84895)',       0x7b8d0)
dump('gold   (expect 261815)',      0x7b8d8)
dump('level  (expect 123)',         0x1c4904)
dump('heart  (expect 15)',          0x1c4910)
dump('tonfa prof (expect 500000)',  0x1c4ad4)
console.log()

// ── Suspect skill point offsets ────────────────────────────────────────────────
console.log('=== Skill point offsets (current constants) ===')
dump('ONMYO_SKILL_PTS (expect 9)',   0x1c4908)
dump('AXE_SKILL_PTS   (expect 0)',   0x1c4818)
dump('ODACHI_SKILL_PTS (expect 0)',  0x1c4838)
dump('SAMURAI_SKILL_PTS',            0x1c48e8)
dump('NINJA_SKILL_PTS',              0x1c48f8)
console.log()

// ── Search for Shiftling — scan the skill point block for values 3 ─────────────
console.log('=== Scanning 0x1c4700..0x1c4a00 for value=3 (shiftling skill pts?) ===')
for (let off = 0x1c4700; off < 0x1c4a00; off += 4) {
  const v = readLE(off)
  if (v === 3) console.log(`  offset=${hex(off)}  value=${v}`)
}
console.log()

// ── Search for Shiftling — scan the proficiency block for value=20230 ──────────
console.log('=== Scanning 0x1c4a00..0x1c4c00 for value=20230 (shiftling proficiency?) ===')
for (let off = 0x1c4a00; off < 0x1c4c00; off += 4) {
  const v = readLE(off)
  if (v === 20230) console.log(`  offset=${hex(off)}  value=${v}`)
}
console.log()

// ── Dump entire skill pts block ────────────────────────────────────────────────
console.log('=== Full skill pts block 0x1c47e0..0x1c4920 (every 4 bytes) ===')
for (let off = 0x1c47e0; off < 0x1c4920; off += 0x10) {
  const row = []
  for (let j = 0; j < 4; j++) {
    const o = off + j*4
    row.push(`${hex(o)}=${readLE(o)}`)
  }
  console.log(' ', row.join('  '))
}
console.log()

// ── Dump proficiency block ────────────────────────────────────────────────────
console.log('=== Full proficiency block 0x1c4a80..0x1c4b80 (every 4 bytes) ===')
for (let off = 0x1c4a80; off < 0x1c4b80; off += 0x10) {
  const row = []
  for (let j = 0; j < 4; j++) {
    const o = off + j*4
    row.push(`${hex(o)}=${readLE(o)}`)
  }
  console.log(' ', row.join('  '))
}
