#!/usr/bin/env tsx
/**
 * Create or update enterprise SSO config for an organization:
 * - (With `--metadata`) Creates or updates the SAML provider in **Google Identity Platform**
 * - Writes `ssoDomains/{domain}` docs (used by the app for email → SSO routing)
 * - Updates `organizations/{orgId}` with `ssoProviderId` and `ssoDomains[]`
 *
 * Auth: Application Default Credentials (no service account JSON).
 *   gcloud auth application-default login
 *   Requires IAM permission `firebaseauth.configs.update` on the GCP project for Identity Platform.
 *   # optional: export GOOGLE_CLOUD_PROJECT=your-firebase-gcp-project-id
 *
 * Run (interactive, uses @clack/prompts):
 *   cd scripts && npm install && npx tsx configure-org-sso.ts
 *
 * Or from the **repo root** (path to the script must include `scripts/`):
 *   npm install --prefix scripts
 *   npm run configure-org-sso -- -- --org <orgDocId> --metadata scripts/fixtures/mock-saml-metadata.xml [--project ...] [--yes]
 *   # (first `--` is for npm; second `--` is for the script.)
 *
 * Non-interactive:
 *   npx tsx scripts/configure-org-sso.ts -- --org <orgDocId> --provider saml.example \\
 *     --domains domain1.com,domain2.com [--project <gcpProjectId>] [--name "Acme"] [--yes]
 *
 * From IdP metadata XML (Identity Platform + Firestore; derives provider id + email domain from entityID):
 *   npx tsx scripts/configure-org-sso.ts -- --org <orgDocId> \\
 *     --metadata scripts/fixtures/mock-saml-metadata.xml [--project <gcpProjectId>] [--yes]
 *
 * Flags:
 *   --skip-identity-platform     Only update Firestore (no Identity Platform API calls)
 *   --identity-create-only       If SAML provider already exists, do not update it from metadata
 *   --rp-entity-id <url>        SP entity ID / audience (default: Firebase handler URL)
 *   --callback-url <url>        ACS / OAuth redirect URL (default: https://PROJECT_ID.firebaseapp.com/__/auth/handler)
 */

import { intro, outro, text, confirm, spinner } from '@clack/prompts';
import { initializeApp, applicationDefault, getApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  loadMetadataFile,
  type ParsedSamlMetadata,
} from './saml-metadata';
import { applyIdentityPlatformSamlFromMetadata } from './identity-platform-saml';

const SSO_DOMAINS_COLLECTION = 'ssoDomains';
const ORGANIZATIONS_COLLECTION = 'organizations';

interface CliArgs {
  project?: string | boolean;
  org?: string | boolean;
  provider?: string | boolean;
  domains?: string | boolean;
  /** Path or file:// URL to IdP metadata XML (Mock SAML, Okta, etc.) */
  metadata?: string | boolean;
  name?: string | boolean;
  yes?: string | boolean;
  /** Do not call Identity Platform; Firestore only */
  skipidentityplatform?: string | boolean;
  /** If SAML provider exists, do not overwrite with metadata */
  identitycreateonly?: string | boolean;
  rpentityid?: string | boolean;
  callbackurl?: string | boolean;
  /** @deprecated ignored; use ADC + optional --project */
  env?: string | boolean;
}

function flagTrue(v: string | boolean | undefined): boolean {
  return v === true || String(v).toLowerCase() === 'true';
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      continue;
    }
    const key = a.slice(2).replace(/-/g, '');
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      (out as Record<string, string | boolean>)[key] = next;
      i++;
    } else {
      (out as Record<string, string | boolean>)[key] = true;
    }
  }
  return out;
}

function normalizeDomains(raw: string): string[] {
  const parts = raw.split(/[,\s]+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const d = p.trim().toLowerCase();
    if (!d || seen.has(d)) {
      continue;
    }
    seen.add(d);
    out.push(d);
  }
  return out;
}

let firebaseApp: App | null = null;

/** Uses Application Default Credentials. Optional projectId if ADC has no default. */
function initializeFirebase(projectId?: string): App {
  if (firebaseApp) {
    return firebaseApp;
  }
  const trimmed = projectId?.trim();
  firebaseApp = initializeApp({
    credential: applicationDefault(),
    ...(trimmed ? { projectId: trimmed } : {}),
  });
  return firebaseApp;
}

type OrgDoc = {
  id?: string;
  name?: string;
  ssoProviderId?: string;
  ssoDomains?: string[];
};

async function applySsoConfig(
  organizationId: string,
  providerId: string,
  domains: string[],
  organizationName: string | undefined
): Promise<void> {
  const db = getFirestore();
  const orgRef = db.doc(`${ORGANIZATIONS_COLLECTION}/${organizationId}`);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new Error(`Organization not found: ${organizationId}`);
  }
  const orgData = orgSnap.data() as OrgDoc;
  const displayName =
    organizationName?.trim() || orgData.name || organizationId;

  const batch = db.batch();
  for (const domain of domains) {
    const ref = db.doc(`${SSO_DOMAINS_COLLECTION}/${domain}`);
    batch.set(ref, {
      organizationId,
      providerId: providerId.trim(),
      organizationName: displayName,
    });
  }
  batch.update(orgRef, {
    ssoProviderId: providerId.trim(),
    ssoDomains: domains,
  });
  await batch.commit();
}

function resolveProjectId(
  args: CliArgs,
  interactiveValue: string | undefined
): string | undefined {
  if (typeof args.project === 'string' && args.project.trim()) {
    return args.project.trim();
  }
  if (interactiveValue?.trim()) {
    return interactiveValue.trim();
  }
  if (process.env.GOOGLE_CLOUD_PROJECT?.trim()) {
    return process.env.GOOGLE_CLOUD_PROJECT.trim();
  }
  if (process.env.GCLOUD_PROJECT?.trim()) {
    return process.env.GCLOUD_PROJECT.trim();
  }
  return undefined;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage:
  Interactive (prompts for org, provider, domains, optional project id):
    cd scripts && npm install && npx tsx configure-org-sso.ts

  From repo root (install script deps once: npm install --prefix scripts):
    npm run configure-org-sso -- -- --org <orgDocId> --metadata scripts/fixtures/mock-saml-metadata.xml [--yes]

  Non-interactive:
    npx tsx scripts/configure-org-sso.ts -- --org <orgDocId> --provider <saml.providerId> \\
      --domains domain1.com,domain2.com [--project <gcpProjectId>] [--name "Label"] [--yes]

  With SAML metadata XML (Identity Platform + Firestore; defaults from entityID + certs + SSO URL):
    npx tsx scripts/configure-org-sso.ts -- --org <orgDocId> --metadata scripts/fixtures/mock-saml-metadata.xml \\
      [--skip-identity-platform] [--identity-create-only] [--rp-entity-id URL] [--callback-url URL] \\
      [--project <gcpProjectId>] [--yes]

  Auth: Application Default Credentials
    gcloud auth application-default login

  If Firestore fails with "project id" errors, pass --project or set GOOGLE_CLOUD_PROJECT.`);
    process.exit(0);
    return;
  }

  const args = parseArgs(argv);

  let metadataHints: ParsedSamlMetadata | null = null;
  if (typeof args.metadata === 'string' && args.metadata.trim()) {
    try {
      metadataHints = loadMetadataFile(args.metadata.trim());
    } catch (e) {
      console.error(e);
      process.exit(1);
      return;
    }
  }

  const nonInteractive =
    typeof args.org === 'string' &&
    Boolean(args.org.toString().trim()) &&
    (Boolean(typeof args.provider === 'string' && args.provider.trim()) ||
      metadataHints !== null) &&
    (Boolean(typeof args.domains === 'string' && String(args.domains).trim()) ||
      metadataHints !== null);

  if (!nonInteractive) {
    intro('Configure organization SSO (Firestore)');
  }

  let interactiveProjectAnswer: string | undefined;
  if (!nonInteractive) {
    const pid = await text({
      message:
        'GCP / Firebase project ID (Enter to use GOOGLE_CLOUD_PROJECT or gcloud default)',
      placeholder: 'my-firebase-project',
    });
    if (typeof pid === 'string' && pid.trim()) {
      interactiveProjectAnswer = pid.trim();
    }
  }

  const projectId = resolveProjectId(args, interactiveProjectAnswer);

  const s = spinner();
  s.start(
    projectId
      ? `Initializing Firebase (project: ${projectId}, ADC)…`
      : 'Initializing Firebase (Application Default Credentials)…'
  );
  try {
    initializeFirebase(projectId);
    s.stop('Firebase ready');
  } catch (e) {
    s.stop('Init failed');
    console.error(e);
    outro(
      'Could not initialize the Admin SDK. Run: gcloud auth application-default login\n' +
        'If needed set GOOGLE_CLOUD_PROJECT or pass --project when using flags.'
    );
    process.exit(1);
    return;
  }

  let organizationId: string;
  if (args.org) {
    organizationId = String(args.org).trim();
  } else {
    const id = await text({
      message: 'Organization ID (Firestore document id)',
      placeholder: 'abc123…',
      validate: (v: string) => (v?.trim() ? undefined : 'Required'),
    });
    if (typeof id !== 'string' || !id.trim()) {
      outro('Cancelled');
      return;
    }
    organizationId = id.trim();
  }

  let providerId: string;
  if (args.provider) {
    providerId = String(args.provider).trim();
  } else if (metadataHints) {
    providerId = metadataHints.suggestedProviderId;
  } else {
    const p = await text({
      message: 'Identity Platform provider id (e.g. saml.marriott)',
      placeholder: 'saml.your-customer',
      validate: (v: string) => (v?.trim() ? undefined : 'Required'),
    });
    if (typeof p !== 'string' || !p.trim()) {
      outro('Cancelled');
      return;
    }
    providerId = p.trim();
  }

  let domains: string[];
  if (args.domains) {
    domains = normalizeDomains(String(args.domains));
  } else if (metadataHints) {
    domains = [metadataHints.suggestedEmailDomain];
  } else {
    const d = await text({
      message: 'Email domains (comma-separated)',
      placeholder: 'company.com, subsidiary.com',
      validate: (v: string) => {
        const list = normalizeDomains(v || '');
        return list.length ? undefined : 'At least one domain required';
      },
    });
    if (typeof d !== 'string') {
      outro('Cancelled');
      return;
    }
    domains = normalizeDomains(d);
  }

  if (!domains.length) {
    outro('No domains to configure');
    return;
  }

  let organizationName: string | undefined;
  if (typeof args.name === 'string' && args.name.trim()) {
    organizationName = args.name.trim();
  } else if (!nonInteractive) {
    const n = await text({
      message:
        'Optional: display name on ssoDomains docs (Enter to use org.name from Firestore)',
      placeholder: 'Leave empty',
    });
    if (typeof n === 'string' && n.trim()) {
      organizationName = n.trim();
    }
  }

  const db = getFirestore();
  const orgSnap = await db
    .doc(`${ORGANIZATIONS_COLLECTION}/${organizationId}`)
    .get();
  if (!orgSnap.exists) {
    outro(`Organization not found: ${organizationId}`);
    process.exit(1);
    return;
  }
  const orgData = orgSnap.data() as OrgDoc;

  const skipIdentityPlatform = flagTrue(args.skipidentityplatform);
  const identityCreateOnly = flagTrue(args.identitycreateonly);
  const firebaseProjectId =
    projectId?.trim() || getApp().options.projectId || '';

  const idpSummaryLine = metadataHints
    ? skipIdentityPlatform
      ? 'Identity Platform: skipped (--skip-identity-platform)'
      : `Identity Platform: SAML provider ${providerId} (create${
          identityCreateOnly ? ', no overwrite if exists' : ' or update from metadata'
        })`
    : 'Identity Platform: skipped (no --metadata; Firestore-only)';

  const summary = [
    firebaseProjectId ? `Project: ${firebaseProjectId}` : 'Project: (ADC default / env)',
    idpSummaryLine,
    `Organization: ${orgData.name ?? organizationId} (${organizationId})`,
    `Provider: ${providerId}`,
    `Domains: ${domains.join(', ')}`,
    `ssoDomains docs: ${domains.map(d => `${SSO_DOMAINS_COLLECTION}/${d}`).join(', ')}`,
  ].join('\n');

  console.log('\n' + summary + '\n');

  const skipConfirm = args.yes === true || String(args.yes) === 'true';
  if (!skipConfirm) {
    const ok = await confirm({ message: 'Apply this configuration?' });
    if (!ok) {
      outro('Cancelled');
      return;
    }
  }

  const run = spinner();
  try {
    if (metadataHints && !skipIdentityPlatform) {
      if (!firebaseProjectId) {
        throw new Error(
          'Could not resolve GCP project id for SAML callback URL. Pass --project or set GOOGLE_CLOUD_PROJECT.'
        );
      }
      const providerDisplayName =
        organizationName?.trim() ||
        orgData.name ||
        `SAML ${providerId.replace(/^saml\./, '')}`;
      run.start('Identity Platform: SAML provider…');
      const idpResult = await applyIdentityPlatformSamlFromMetadata(
        providerId,
        metadataHints,
        {
          firebaseProjectId,
          providerDisplayName,
          updateIfExists: !identityCreateOnly,
          rpEntityId:
            typeof args.rpentityid === 'string' ? args.rpentityid.trim() : undefined,
          callbackURL:
            typeof args.callbackurl === 'string' ? args.callbackurl.trim() : undefined,
        }
      );
      run.stop(
        idpResult === 'created'
          ? 'Identity Platform: SAML provider created'
          : idpResult === 'updated'
            ? 'Identity Platform: SAML provider updated from metadata'
            : 'Identity Platform: provider already exists (not updated; remove --identity-create-only to refresh)'
      );
    }

    run.start('Firestore: organization + ssoDomains…');
    await applySsoConfig(
      organizationId,
      providerId,
      domains,
      organizationName
    );
    run.stop('Done');
    outro(
      'SSO config saved.\n' +
        '• Register the SP entity ID and ACS URL with your IdP if you have not already (defaults use *.firebaseapp.com/__/auth/handler).\n' +
        '• Old ssoDomains/* docs you no longer list are not removed — delete manually if needed.'
    );
  } catch (e) {
    run.stop('Failed');
    console.error(e);
    outro('Error — see above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
