import { getAuth } from 'firebase-admin/auth';
import type { SAMLAuthProviderConfig } from 'firebase-admin/auth';
import type { ParsedSamlMetadata } from './saml-metadata';

/**
 * Creates or updates a SAML provider in Google Identity Platform from parsed metadata.
 * Requires Identity Platform on the GCP project and IAM permission `firebaseauth.configs.update`.
 */
export async function applyIdentityPlatformSamlFromMetadata(
  providerId: string,
  parsed: ParsedSamlMetadata,
  opts: {
    firebaseProjectId: string;
    providerDisplayName: string;
    /** If true and provider already exists, replace IdP settings from metadata. */
    updateIfExists: boolean;
    rpEntityId?: string;
    callbackURL?: string;
  }
): Promise<'created' | 'updated' | 'skipped'> {
  if (!parsed.idpCertificatesPem.length) {
    throw new Error(
      'No X509Certificate found in metadata; Identity Platform requires at least one signing cert'
    );
  }

  const callbackURL =
    opts.callbackURL?.trim() ||
    `https://${opts.firebaseProjectId}.firebaseapp.com/__/auth/handler`;
  const rpEntityId = opts.rpEntityId?.trim() || callbackURL;

  const config: SAMLAuthProviderConfig = {
    providerId,
    displayName: opts.providerDisplayName,
    enabled: true,
    idpEntityId: parsed.entityId,
    ssoURL: parsed.ssoURL,
    x509Certificates: parsed.idpCertificatesPem,
    rpEntityId,
    callbackURL,
  };

  const auth = getAuth();
  let exists = false;
  try {
    await auth.getProviderConfig(providerId);
    exists = true;
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code !== 'auth/configuration-not-found') {
      throw e;
    }
  }

  if (!exists) {
    await auth.createProviderConfig(config);
    return 'created';
  }

  if (!opts.updateIfExists) {
    return 'skipped';
  }

  await auth.updateProviderConfig(providerId, {
    displayName: config.displayName,
    enabled: config.enabled,
    idpEntityId: config.idpEntityId,
    ssoURL: config.ssoURL,
    x509Certificates: config.x509Certificates,
    rpEntityId: config.rpEntityId,
    callbackURL: config.callbackURL,
  });
  return 'updated';
}
