import {appConfig} from "../config";
import * as crypto from "crypto";

function unpack(ctx: string) {
  // Decode base64
  let buf = Buffer.from(ctx, "base64");

  // Get iv length (1 byte)
  const ivLength = buf.readUInt8();
  buf = buf.slice(1);

  // Get iv
  const iv = buf.slice(0, ivLength);
  buf = buf.slice(ivLength);

  // Get aad length (2 bytes)
  const aadLength = buf.readUInt16LE();
  buf = buf.slice(2);

  // Get aad
  const aad = buf.slice(0, aadLength);
  buf = buf.slice(aadLength);

  // Get cipher length (4 bytes)
  const cipherLength = buf.readInt32LE();
  buf = buf.slice(4);

  // Get cipherText
  const cipherText = buf.slice(0, cipherLength);

  // Get tag
  const tag = buf.slice(cipherLength);

  return {
    iv,
    aad,
    cipherText,
    tag,
  };
}

function decrypt(
    cipherText: Buffer,
    hash: crypto.CipherKey,
    iv: crypto.BinaryLike,
    aad: NodeJS.ArrayBufferView,
    tag: NodeJS.ArrayBufferView
) {
  // AES/GCM decryption
  const decipher = crypto
      .createDecipheriv("aes-256-gcm", hash, iv)
      .setAAD(aad)
      .setAuthTag(tag)
      .setAutoPadding(false);

  const update = decipher.update(cipherText as any, "hex", "utf-8");
  const final = decipher.final("utf-8");

  const decrypted = update + final;

  return JSON.parse(decrypted);
}

export function getAppContext(header: string, isDev: boolean) {
  if (!header || typeof header !== "string") {
    throw Error("context header must be a valid string");
  }

  const key = isDev ?
    appConfig.zoomClientSecretDev :
    appConfig.zoomClientSecret;

  // Decode and parse context
  const {iv, aad, cipherText, tag} = unpack(header);

  console.log(iv, aad, cipherText, tag);
  // Create sha256 hash from Client Secret (key)
  const hash = crypto.createHash("sha256").update(key).digest();

  // return decrypted context
  return decrypt(cipherText, hash, iv, aad, tag);
}

export const contextHeader = "x-zoom-app-context";
