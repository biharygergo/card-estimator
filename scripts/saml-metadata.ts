import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export type ParsedSamlMetadata = {
  entityId: string;
  suggestedProviderId: string;
  suggestedEmailDomain: string;
  singleSignOnServiceLocations: string[];
  /** PEM-encoded certs for `createProviderConfig` / `updateProviderConfig` */
  idpCertificatesPem: string[];
  /** IdP SSO URL (HTTP-POST preferred, then redirect) */
  ssoURL: string;
  /** From `WantAuthnRequestsSigned` on IDPSSODescriptor (REST PATCH needed to enable in GCP). */
  wantAuthnRequestsSigned: boolean;
};

export function resolveMetadataPath(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('file://')) {
    return fileURLToPath(t);
  }
  return path.isAbsolute(t) ? t : path.resolve(process.cwd(), t);
}

function toPemCertificate(base64OneLine: string): string {
  const cleaned = base64OneLine.replace(/\s+/g, '');
  const chunks = cleaned.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${chunks.join('\n')}\n-----END CERTIFICATE-----`;
}

function extractX509CertificatesPem(xml: string): string[] {
  const re = /<[^:>]*:?X509Certificate[^>]*>([\s\S]*?)<\/[^:>]*:?X509Certificate>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const b64 = m[1].replace(/\s+/g, '');
    if (b64.length) {
      out.push(toPemCertificate(b64));
    }
  }
  return out;
}

function extractWantAuthnRequestsSigned(xml: string): boolean {
  const open = xml.match(/<[^:>]*:?IDPSSODescriptor\b([^/>]*?)(?:\/>|>)/i);
  if (!open?.[1]) {
    return false;
  }
  const attr = open[1].match(/\bWantAuthnRequestsSigned="([^"]*)"/i);
  return attr ? /^true$/i.test(attr[1].trim()) : false;
}

function pickSsoUrl(xml: string, fallbackLocations: string[]): string {
  const choices: { binding: string; location: string }[] = [];
  const tagRe = /<[^:>]*:?SingleSignOnService\b([^/>]+)\/>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(xml)) !== null) {
    const attrs = m[1];
    const binding = attrs.match(/\bBinding="([^"]+)"/)?.[1] ?? '';
    const location = attrs.match(/\bLocation="([^"]+)"/)?.[1] ?? '';
    if (binding && location) {
      choices.push({ binding, location });
    }
  }

  const post = choices.find(
    c => c.binding.includes('HTTP-POST') || c.binding.endsWith(':HTTP-POST')
  );
  const redirect = choices.find(
    c =>
      c.binding.includes('HTTP-Redirect') || c.binding.endsWith(':HTTP-Redirect')
  );
  const pick = post ?? redirect ?? choices[0];
  if (pick) {
    return pick.location;
  }
  if (fallbackLocations[0]) {
    return fallbackLocations[0];
  }
  throw new Error('No SingleSignOnService with Location in SAML metadata');
}

/**
 * Minimal SAML 2.0 metadata parsing (no XML dependency). Derives Firestore-oriented defaults:
 * - entityID must be an absolute URL; hostname `saml.example.com` → provider `saml.example`, domain `example.com`
 */
export function parseSamlMetadataXml(xml: string): ParsedSamlMetadata {
  const entityMatch = xml.match(/\bentityID="([^"]+)"/);
  if (!entityMatch) {
    throw new Error('Could not find entityID="..." in SAML metadata');
  }
  const entityId = entityMatch[1].trim();
  let hostname: string;
  try {
    hostname = new URL(entityId).hostname.toLowerCase();
  } catch {
    throw new Error(`entityID is not a valid URL: ${entityId}`);
  }

  const parts = hostname.split('.').filter(Boolean);
  let suggestedEmailDomain: string;
  let suggestedProviderId: string;
  if (parts[0] === 'saml' && parts.length >= 3) {
    suggestedEmailDomain = parts.slice(1).join('.');
    suggestedProviderId = `saml.${parts[1]}`;
  } else if (parts.length >= 2) {
    suggestedEmailDomain = parts.slice(-2).join('.');
    suggestedProviderId = `saml.${parts[parts.length - 2]}`;
  } else {
    suggestedEmailDomain = hostname;
    suggestedProviderId = `saml.${hostname.replace(/\./g, '')}`;
  }

  const singleSignOnServiceLocations: string[] = [];
  const locRe = /SingleSignOnService[^>]*\bLocation="([^"]+)"/gi;
  let lm: RegExpExecArray | null;
  while ((lm = locRe.exec(xml)) !== null) {
    singleSignOnServiceLocations.push(lm[1]);
  }

  const idpCertificatesPem = extractX509CertificatesPem(xml);
  const ssoURL = pickSsoUrl(xml, singleSignOnServiceLocations);
  const wantAuthnRequestsSigned = extractWantAuthnRequestsSigned(xml);

  return {
    entityId,
    suggestedProviderId,
    suggestedEmailDomain,
    singleSignOnServiceLocations,
    idpCertificatesPem,
    ssoURL,
    wantAuthnRequestsSigned,
  };
}

export function loadMetadataFile(pathArg: string): ParsedSamlMetadata {
  const p = resolveMetadataPath(pathArg);
  const xml = fs.readFileSync(p, 'utf8');
  const parsed = parseSamlMetadataXml(xml);
  console.log(
    [
      '',
      '─ IdP metadata',
      `  File: ${p}`,
      `  entityID: ${parsed.entityId}`,
      `  SSO URL (selected): ${parsed.ssoURL}`,
      `  X.509 certs: ${parsed.idpCertificatesPem.length}`,
      `  WantAuthnRequestsSigned (IdP): ${parsed.wantAuthnRequestsSigned}`,
      `  → suggested Identity Platform provider id: ${parsed.suggestedProviderId}`,
      `  → suggested email domain (ssoDomains): ${parsed.suggestedEmailDomain}`,
      '',
    ].join('\n')
  );
  if (parsed.wantAuthnRequestsSigned) {
    console.log(
      '  Note: IdP requests signed AuthnRequests. After create, enable signing via Identity Platform REST:\n' +
        '  PATCH .../inboundSamlConfigs/<providerId>?updateMask=idpConfig.signRequest  body: {"idpConfig":{"signRequest":true}}\n' +
        '  See https://cloud.google.com/identity-platform/docs/web/saml#sign_requests\n'
    );
  }
  return parsed;
}
