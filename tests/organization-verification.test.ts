import { describe, it, expect, beforeEach } from 'vitest';

// Mock Clarity contract interaction
const organizationVerificationContract = {
  state: {
    orgCount: 0,
    organizations: new Map(),
    principalToId: new Map(),
    verifiers: new Map(),
    admin: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
  },
  
  // Constants
  STATUS_PENDING: 1,
  STATUS_VERIFIED: 2,
  STATUS_REJECTED: 3,
  
  // Error codes
  ERR_UNAUTHORIZED: 1,
  ERR_ALREADY_REGISTERED: 2,
  ERR_NOT_FOUND: 3,
  
  registerOrganization(name, description, sender) {
    // Check if already registered
    if (this.state.principalToId.has(sender)) {
      return { error: this.ERR_ALREADY_REGISTERED };
    }
    
    const id = this.state.orgCount + 1;
    
    this.state.organizations.set(id, {
      principal: sender,
      name,
      description,
      status: this.STATUS_PENDING
    });
    
    this.state.principalToId.set(sender, id);
    this.state.orgCount = id;
    
    return { value: id };
  },
  
  addVerifier(verifier, sender) {
    if (sender !== this.state.admin) {
      return { error: this.ERR_UNAUTHORIZED };
    }
    
    this.state.verifiers.set(verifier, true);
    return { value: true };
  },
  
  verifyOrganization(id, status, sender) {
    if (!this.state.verifiers.has(sender)) {
      return { error: this.ERR_UNAUTHORIZED };
    }
    
    if (!this.state.organizations.has(id)) {
      return { error: this.ERR_NOT_FOUND };
    }
    
    const org = this.state.organizations.get(id);
    org.status = status;
    
    this.state.organizations.set(id, org);
    return { value: true };
  },
  
  getOrganization(id) {
    return this.state.organizations.get(id) || null;
  },
  
  getId(principal) {
    return this.state.principalToId.get(principal) || null;
  },
  
  isVerified(id) {
    const org = this.state.organizations.get(id);
    if (!org) return false;
    return org.status === this.STATUS_VERIFIED;
  }
};

describe('Organization Verification Contract', () => {
  const admin = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const verifier = 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ';
  const org1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
  
  beforeEach(() => {
    // Reset state before each test
    organizationVerificationContract.state.orgCount = 0;
    organizationVerificationContract.state.organizations = new Map();
    organizationVerificationContract.state.principalToId = new Map();
    organizationVerificationContract.state.verifiers = new Map();
    organizationVerificationContract.state.admin = admin;
  });
  
  it('should register a new organization', () => {
    const result = organizationVerificationContract.registerOrganization(
        'Helping Hands',
        'Community service organization',
        org1
    );
    
    expect(result).toHaveProperty('value');
    expect(result.value).toBe(1);
    
    const orgData = organizationVerificationContract.getOrganization(1);
    expect(orgData).not.toBeNull();
    expect(orgData.name).toBe('Helping Hands');
    expect(orgData.description).toBe('Community service organization');
    expect(orgData.status).toBe(organizationVerificationContract.STATUS_PENDING);
  });
  
  it('should allow admin to add verifiers', () => {
    const result = organizationVerificationContract.addVerifier(verifier, admin);
    
    expect(result).toHaveProperty('value');
    expect(result.value).toBe(true);
    expect(organizationVerificationContract.state.verifiers.has(verifier)).toBe(true);
  });
  
  it('should allow verifiers to verify organizations', () => {
    // Register an organization
    organizationVerificationContract.registerOrganization('Helping Hands', 'Description', org1);
    
    // Add a verifier
    organizationVerificationContract.addVerifier(verifier, admin);
    
    // Verify the organization
    const result = organizationVerificationContract.verifyOrganization(
        1,
        organizationVerificationContract.STATUS_VERIFIED,
        verifier
    );
    
    expect(result).toHaveProperty('value');
    expect(result.value).toBe(true);
    
    const orgData = organizationVerificationContract.getOrganization(1);
    expect(orgData.status).toBe(organizationVerificationContract.STATUS_VERIFIED);
    expect(organizationVerificationContract.isVerified(1)).toBe(true);
  });
});
