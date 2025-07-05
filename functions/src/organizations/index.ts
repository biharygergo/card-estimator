import {getFirestore} from "firebase-admin/firestore";
import {Organization, OrganizationRole, OrganizationMember} from "../types";
import {getUserPreference} from "../shared/users";
import {getAuth} from "firebase-admin/auth";

export async function getOrganizations(userId: string): Promise<Organization[]> {
  const orgs = await getFirestore()
      .collection("organizations")
      .where("memberIds", "array-contains", userId)
      .get();

  return orgs.docs.map((doc) => doc.data() as Organization);
}

export async function getCurrentOrganization(userId: string): Promise<Organization | undefined> {
  const orgs = await getOrganizations(userId);
  const userPreference = await getUserPreference(userId);

  const selectedOrg = orgs.find((org) => org.id === userPreference?.activeOrganizationId);
  return selectedOrg ?? orgs.at(0);
}

export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const organization = await getFirestore()
      .doc(`organizations/${organizationId}`)
      .get();

  if (!organization.exists) {
    throw new Error("Organization not found");
  }

  const orgData = organization.data() as Organization;
  const memberIds = orgData.memberIds || [];
  const memberRoles = orgData.memberRoles || {};

  // Get user profiles for all members
  const userProfiles = await Promise.all(
      memberIds.map(async (memberId) => {
        try {
          const userRecord = await getAuth().getUser(memberId);
          return {
            id: memberId,
            displayName: userRecord.displayName || userRecord.email?.split("@")[0] || "Unknown User",
            email: userRecord.email || "",
            role: memberRoles[memberId] || (orgData.createdById === memberId ? OrganizationRole.ADMIN : OrganizationRole.MEMBER),
            joinedAt: orgData.createdAt, // For now, using org creation date. Could be enhanced with actual join dates
          };
        } catch (error) {
          console.error(`Error fetching user ${memberId}:`, error);
          return {
            id: memberId,
            displayName: "Unknown User",
            email: "",
            role: memberRoles[memberId] || OrganizationRole.MEMBER,
            joinedAt: orgData.createdAt,
          };
        }
      })
  );

  return userProfiles;
}

export async function updateMemberRole(
    organizationId: string,
    memberId: string,
    newRole: OrganizationRole,
    updatedByUserId: string
): Promise<void> {
  const organization = await getFirestore()
      .doc(`organizations/${organizationId}`)
      .get();

  if (!organization.exists) {
    throw new Error("Organization not found");
  }

  const orgData = organization.data() as Organization;

  // Check if the user updating has admin rights
  if (!isUserAdmin(orgData, updatedByUserId)) {
    throw new Error("Insufficient permissions to update member roles");
  }

  // Check if the member exists in the organization
  if (!orgData.memberIds.includes(memberId)) {
    throw new Error("Member not found in organization");
  }

  // Prevent removing the last admin
  if (newRole !== OrganizationRole.ADMIN && isLastAdmin(orgData, memberId)) {
    throw new Error("Cannot remove the last admin from the organization");
  }

  const memberRoles = orgData.memberRoles || {};
  memberRoles[memberId] = newRole;

  await getFirestore()
      .doc(`organizations/${organizationId}`)
      .update({memberRoles});
}

export async function removeMemberFromOrganization(
    organizationId: string,
    memberId: string,
    removedByUserId: string
): Promise<void> {
  const organization = await getFirestore()
      .doc(`organizations/${organizationId}`)
      .get();

  if (!organization.exists) {
    throw new Error("Organization not found");
  }

  const orgData = organization.data() as Organization;

  // Check if the user removing has admin rights
  if (!isUserAdmin(orgData, removedByUserId)) {
    throw new Error("Insufficient permissions to remove members");
  }

  // Check if the member exists in the organization
  if (!orgData.memberIds.includes(memberId)) {
    throw new Error("Member not found in organization");
  }

  // Prevent removing the last admin
  if (isLastAdmin(orgData, memberId)) {
    throw new Error("Cannot remove the last admin from the organization");
  }

  const updatedMemberIds = orgData.memberIds.filter((id) => id !== memberId);
  const memberRoles = orgData.memberRoles || {};
  delete memberRoles[memberId];

  await getFirestore()
      .doc(`organizations/${organizationId}`)
      .update({
        memberIds: updatedMemberIds,
        memberRoles,
      });
}

// Helper functions
export function isUserAdmin(organization: Organization, userId: string): boolean {
  const memberRoles = organization.memberRoles || {};
  return memberRoles[userId] === OrganizationRole.ADMIN || organization.createdById === userId;
}

export function isLastAdmin(organization: Organization, userId: string): boolean {
  const memberRoles = organization.memberRoles || {};
  const adminMembers = Object.entries(memberRoles)
      .filter(([, role]) => role === OrganizationRole.ADMIN)
      .map(([memberId]) => memberId);

  // Include the creator if they don't have an explicit role
  if (!memberRoles[organization.createdById]) {
    adminMembers.push(organization.createdById);
  }

  return adminMembers.length === 1 && adminMembers[0] === userId;
}

export function getUserRole(organization: Organization, userId: string): OrganizationRole {
  const memberRoles = organization.memberRoles || {};
  return memberRoles[userId] || (organization.createdById === userId ? OrganizationRole.ADMIN : OrganizationRole.MEMBER);
}
