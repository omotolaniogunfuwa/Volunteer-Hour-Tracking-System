import { describe, it, expect, beforeEach } from 'vitest';

// Mock Clarity contract interaction
const volunteerRegistrationContract = {
  state: {
    volunteerCount: 0,
    volunteers: new Map(),
    principalToId: new Map(),
    admin: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
  },
  
  // Constants
  STATUS_ACTIVE: 1,
  STATUS_INACTIVE: 2,
  
  // Error codes
  ERR_UNAUTHORIZED: 1,
  ERR_ALREADY_REGISTERED: 2,
  ERR_NOT_FOUND: 3,
  
  registerVolunteer(name, skills, sender) {
    // Check if already registered
    if (this.state.principalToId.has(sender)) {
      return { error: this.ERR_ALREADY_REGISTERED };
    }
    
    const id = this.state.volunteerCount + 1;
    
    this.state.volunteers.set(id, {
      principal: sender,
      name,
      skills,
      status: this.STATUS_ACTIVE
    });
    
    this.state.principalToId.set(sender, id);
    this.state.volunteerCount = id;
    
    return { value: id };
  },
  
  updateStatus(id, status, sender) {
    if (sender !== this.state.admin) {
      return { error: this.ERR_UNAUTHORIZED };
    }
    
    if (!this.state.volunteers.has(id)) {
      return { error: this.ERR_NOT_FOUND };
    }
    
    const volunteer = this.state.volunteers.get(id);
    volunteer.status = status;
    
    this.state.volunteers.set(id, volunteer);
    return { value: true };
  },
  
  updateSkills(skills, sender) {
    const id = this.state.principalToId.get(sender);
    if (!id) {
      return { error: this.ERR_NOT_FOUND };
    }
    
    const volunteer = this.state.volunteers.get(id);
    volunteer.skills = skills;
    
    this.state.volunteers.set(id, volunteer);
    return { value: true };
  },
  
  getVolunteer(id) {
    return this.state.volunteers.get(id) || null;
  },
  
  getId(principal) {
    return this.state.principalToId.get(principal) || null;
  },
  
  isActive(id) {
    const volunteer = this.state.volunteers.get(id);
    if (!volunteer) return false;
    return volunteer.status === this.STATUS_ACTIVE;
  }
};

describe('Volunteer Registration Contract', () => {
  const admin = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const volunteer1 = 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ';
  const volunteer2 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
  
  beforeEach(() => {
    // Reset state before each test
    volunteerRegistrationContract.state.volunteerCount = 0;
    volunteerRegistrationContract.state.volunteers = new Map();
    volunteerRegistrationContract.state.principalToId = new Map();
    volunteerRegistrationContract.state.admin = admin;
  });
  
  it('should register a new volunteer', () => {
    const result = volunteerRegistrationContract.registerVolunteer(
        'John Doe',
        'Web Development, Graphic Design',
        volunteer1
    );
    
    expect(result).toHaveProperty('value');
    expect(result.value).toBe(1);
    
    const volunteerData = volunteerRegistrationContract.getVolunteer(1);
    expect(volunteerData).not.toBeNull();
    expect(volunteerData.name).toBe('John Doe');
    expect(volunteerData.skills).toBe('Web Development, Graphic Design');
    expect(volunteerData.status).toBe(volunteerRegistrationContract.STATUS_ACTIVE);
  });
  
  it('should not allow duplicate volunteer registration', () => {
    // Register once
    volunteerRegistrationContract.registerVolunteer('John Doe', 'Skills', volunteer1);
    
    // Try to register again
    const result = volunteerRegistrationContract.registerVolunteer('John Doe Again', 'More Skills', volunteer1);
    
    expect(result).toHaveProperty('error');
    expect(result.error).toBe(volunteerRegistrationContract.ERR_ALREADY_REGISTERED);
  });
  
  it('should allow admin to update volunteer status', () => {
    // Register a volunteer
    volunteerRegistrationContract.registerVolunteer('John Doe', 'Skills', volunteer1);
    
    // Update status
    const result = volunteerRegistrationContract.updateStatus(
        1,
        volunteerRegistrationContract.STATUS_INACTIVE,
        admin
    );
    
    expect(result).toHaveProperty('value');
    expect(result.value).toBe(true);
    
    const volunteerData = volunteerRegistrationContract.getVolunteer(1);
    expect(volunteerData.status).toBe(volunteerRegistrationContract.STATUS_INACTIVE);
    expect(volunteerRegistrationContract.isActive(1)).toBe(false);
  });
});
