#!/usr/bin/env tsx

import { intro, outro, select, text, confirm, spinner } from '@clack/prompts';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Credit, CreditBundle, BundleName } from '../src/app/types';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp: any = null;

async function initializeFirebase(environment: 'test' | 'prod') {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountPath = `./service-accounts/${environment}.json`;
    const serviceAccount = require(serviceAccountPath);
    
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    
    return firebaseApp;
  } catch (error) {
    throw new Error(`Failed to initialize Firebase for ${environment} environment: ${error}`);
  }
}

const CREDITS_COLLECTION = 'credits';
const BUNDLES_COLLECTION = 'bundles';

interface TransferResult {
  success: boolean;
  message: string;
  transferredCredits: number;
  transferredBundle?: CreditBundle;
}

async function getUserCredits(userId: string): Promise<Credit[]> {
  return getFirestore()
    .collection(`userDetails/${userId}/${CREDITS_COLLECTION}`)
    .orderBy('expiresAt', 'asc')
    .get()
    .then(snapshot =>
      snapshot.docs.map(docSnapshot => docSnapshot.data() as Credit)
    );
}

async function getUserBundles(userId: string): Promise<CreditBundle[]> {
  return getFirestore()
    .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
    .orderBy('createdAt', 'desc')
    .get()
    .then(snapshot =>
      snapshot.docs.map(docSnapshot => docSnapshot.data() as CreditBundle)
    );
}

async function getOrganizations(userId: string): Promise<any[]> {
  const orgs = await getFirestore()
    .collection('organizations')
    .where('memberIds', 'array-contains', userId)
    .get();

  return orgs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function createOrganizationCredits(
  organizationId: string,
  bundle: CreditBundle,
  credits: Credit[]
): Promise<void> {
  const batch = getFirestore().batch();

  credits.forEach(credit => {
    const creditRef = getFirestore()
      .collection(`organizations/${organizationId}/${CREDITS_COLLECTION}`)
      .doc();

    const newCredit: Credit = {
      ...credit,
      id: creditRef.id,
      organizationId,
      assignedToUserId: bundle.userId,
    };

    batch.set(creditRef, newCredit);
  });

  await batch.commit();
}

async function createOrganizationBundle(
  organizationId: string,
  bundle: CreditBundle
): Promise<CreditBundle> {
  const newBundleRef = getFirestore()
    .collection(`organizations/${organizationId}/${BUNDLES_COLLECTION}`)
    .doc();

  const newBundle: CreditBundle = {
    ...bundle,
    id: newBundleRef.id,
    name: BundleName.ORGANIZATION_BUNDLE,
    displayName: `Transferred from user - ${bundle.displayName || bundle.name}`,
  };

  await newBundleRef.set(newBundle);
  return newBundle;
}

async function deleteUserCredits(
  userId: string,
  creditIds: string[]
): Promise<void> {
  const batch = getFirestore().batch();

  creditIds.forEach(creditId => {
    const creditRef = getFirestore()
      .collection(`userDetails/${userId}/${CREDITS_COLLECTION}`)
      .doc(creditId);
    batch.delete(creditRef);
  });

  await batch.commit();
}

async function deleteUserBundle(
  userId: string,
  bundleId: string
): Promise<void> {
  const bundleRef = getFirestore()
    .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
    .doc(bundleId);

  await bundleRef.delete();
}

async function transferCreditsToOrganization(
  userId: string,
  bundleId: string,
  organizationId: string
): Promise<TransferResult> {
  try {
    // Get user credits for the specific bundle
    const userCredits = await getUserCredits(userId);
    const bundleCredits = userCredits.filter(
      credit => credit.bundleId === bundleId
    );

    if (bundleCredits.length === 0) {
      return {
        success: false,
        message: `No credits found for bundle ${bundleId}`,
        transferredCredits: 0,
      };
    }

    // Get the bundle
    const userBundles = await getUserBundles(userId);
    const bundle = userBundles.find(b => b.id === bundleId);

    if (!bundle) {
      return {
        success: false,
        message: `Bundle ${bundleId} not found`,
        transferredCredits: 0,
      };
    }

    // Check if credits are already used
    const unusedCredits = bundleCredits.filter(credit => !credit.usedForRoomId);

    if (unusedCredits.length === 0) {
      return {
        success: false,
        message: `All credits in bundle ${bundleId} are already used`,
        transferredCredits: 0,
      };
    }

    // Create organization credits
    await createOrganizationCredits(organizationId, bundle, unusedCredits);

    // Create organization bundle
    const transferredBundle = await createOrganizationBundle(
      organizationId,
      bundle
    );

    // Delete user credits
    await deleteUserCredits(
      userId,
      unusedCredits.map(c => c.id)
    );

    // Delete user bundle
    await deleteUserBundle(userId, bundleId);

    return {
      success: true,
      message: `Successfully transferred ${unusedCredits.length} credits to organization`,
      transferredCredits: unusedCredits.length,
      transferredBundle,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error transferring credits: ${error}`,
      transferredCredits: 0,
    };
  }
}

async function main() {
  intro('Transfer Personal Credits to Organization');

  // Select environment
  const environment = await select({
    message: 'Select the environment:',
    options: [
      { value: 'test', label: 'Test Environment' },
      { value: 'prod', label: 'Production Environment' },
    ],
  });

  if (!environment) {
    outro('Operation cancelled');
    return;
  }

  // Initialize Firebase
  const initSpinner = spinner();
  initSpinner.start(`Initializing Firebase for ${environment} environment...`);
  
  try {
    await initializeFirebase(environment as 'test' | 'prod');
    initSpinner.stop(`✅ Firebase initialized for ${environment} environment`);
  } catch (error) {
    initSpinner.stop(`❌ Failed to initialize Firebase: ${error}`);
    outro('Failed to initialize Firebase. Please check your service account files.');
    return;
  }

  // Get user ID
  const userId = await text({
    message: 'Enter the user ID:',
    placeholder: 'user123',
    validate: value => {
      if (!value) return 'User ID is required';
      return;
    },
  });

  if (!userId) {
    outro('Operation cancelled');
    return;
  }

  // Verify user exists
  const userSpinner = spinner();
  userSpinner.start('Verifying user...');
  
  try {
    await getAuth().getUser(userId as string);
    userSpinner.stop('User verified');
  } catch (error) {
    userSpinner.stop('User not found');
    outro('User not found. Please check the user ID.');
    return;
  }

  // Get user's organizations
  const orgSpinner = spinner();
  orgSpinner.start('Fetching user organizations...');

  const organizations = await getOrganizations(userId as string);
  orgSpinner.stop(`Found ${organizations.length} organizations`);

  if (organizations.length === 0) {
    outro('User is not a member of any organizations');
    return;
  }

  // Select organization
  const organizationChoice = await select({
    message: 'Select the organization to transfer credits to:',
    options: organizations.map(org => ({
      value: org.id,
      label: org.name,
    })),
  });

  if (!organizationChoice) {
    outro('Operation cancelled');
    return;
  }

  // Get user's bundles
  const bundleSpinner = spinner();
  bundleSpinner.start('Fetching user bundles...');

  const userBundles = await getUserBundles(userId as string);
  bundleSpinner.stop(`Found ${userBundles.length} bundles`);

  if (userBundles.length === 0) {
    outro('User has no bundles to transfer');
    return;
  }

  // Select bundle
  const bundleChoice = await select({
    message: 'Select the bundle to transfer:',
    options: userBundles.map(bundle => ({
      value: bundle.id,
      label: `${bundle.displayName || bundle.name} (${
        bundle.creditCount
      } credits)`,
    })),
  });

  if (!bundleChoice) {
    outro('Operation cancelled');
    return;
  }

  // Get credits for the selected bundle
  const creditSpinner = spinner();
  creditSpinner.start('Fetching bundle credits...');

  const userCredits = await getUserCredits(userId as string);
  const bundleCredits = userCredits.filter(
    credit => credit.bundleId === bundleChoice
  );
  const unusedCredits = bundleCredits.filter(credit => !credit.usedForRoomId);

  creditSpinner.stop(
    `Found ${unusedCredits.length} unused credits out of ${bundleCredits.length} total`
  );

  if (unusedCredits.length === 0) {
    outro('No unused credits found in this bundle');
    return;
  }

  // Confirm transfer
  const confirmed = await confirm({
    message: `Transfer ${unusedCredits.length} unused credits from bundle "${
      userBundles.find(b => b.id === bundleChoice)?.displayName ||
      userBundles.find(b => b.id === bundleChoice)?.name
    }" to organization "${
      organizations.find(o => o.id === organizationChoice)?.name
    }"?`,
  });

  if (!confirmed) {
    outro('Transfer cancelled');
    return;
  }

  // Perform transfer
  const transferSpinner = spinner();
  transferSpinner.start('Transferring credits...');

  const result = await transferCreditsToOrganization(
    userId as string,
    bundleChoice as string,
    organizationChoice as string
  );

  transferSpinner.stop('Transfer completed');

  if (result.success) {
    outro(`✅ ${result.message}`);
  } else {
    outro(`❌ ${result.message}`);
  }
}

main().catch(console.error);
