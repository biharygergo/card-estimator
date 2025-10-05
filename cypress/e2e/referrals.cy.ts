import {
  clearFirebaseLocalStorage,
  setAppCheckCookie,
} from '../support/utils';

describe('Referral System', () => {
  beforeEach(() => {
    clearFirebaseLocalStorage();
    setAppCheckCookie();
  });

  describe('Anonymous User', () => {
    it('should show referral dialog with sign-up prompt for anonymous users', () => {
      cy.visit('/create');
      
      // Open profile menu
      cy.get('#menu-button').click();
      
      // Click on "Refer & Earn" menu item
      cy.contains('Refer & Earn').click();
      
      // Verify dialog opens
      cy.contains('Refer & earn credits').should('be.visible');
      
      // Verify anonymous user prompt is shown
      cy.contains('Create an account to start earning credits').should('be.visible');
      cy.contains('Share it with other teams and scrum masters in your network').should('be.visible');
      
      // Verify "Create an account" button is present
      cy.contains('button', 'Create an account').should('be.visible');
      
      // Verify referral stats are NOT shown
      cy.contains('How it works').should('not.exist');
      cy.contains('Your Referral Link').should('not.exist');
      
      // Close dialog
      cy.contains('button', 'Close').click();
      cy.contains('Refer & earn credits').should('not.exist');
    });

    it('should open sign-up dialog when clicking "Create an account"', () => {
      cy.visit('/create');
      
      // Open referral dialog
      cy.get('#menu-button').click();
      cy.contains('Refer & Earn').click();
      
      // Click "Create an account" button
      cy.contains('button', 'Create an account').click();
      
      // Verify sign-up dialog opens
      cy.get('#email-input').should('be.visible');
    });

    it('should store referral code from URL in cookie', () => {
      const testReferralCode = 'TEST1234';
      
      // Visit with referral parameter
      cy.visit(`/create?referral=${testReferralCode}`);
      
      cy.wait(3000);
      // Verify cookie is set
      cy.getCookie('pp_referral').should('have.property', 'value', testReferralCode);
      
      // Verify localStorage also has it
      cy.window().then((win) => {
        expect(win.localStorage.getItem('pp_referral')).to.equal(testReferralCode);
      });
    });

    it('should not overwrite existing referral cookie (first-touch attribution)', () => {
      const firstReferralCode = 'FIRST123';
      const secondReferralCode = 'SECOND456';
      
      // Set initial referral
      cy.visit(`/create?referral=${firstReferralCode}`);
      cy.wait(3000);

      cy.getCookie('pp_referral').should('have.property', 'value', firstReferralCode);
      
      // Try to set a different referral
      cy.visit(`/create?referral=${secondReferralCode}`);
      cy.wait(3000);

      // Verify original cookie is preserved
      cy.getCookie('pp_referral').should('have.property', 'value', firstReferralCode);
    });
  });

  describe('Signed-in User', () => {
    const testEmail = 'cypress-test-premium@example.com';
    const testPassword = Cypress.env('PREMIUM_USER_PASSWORD');

    beforeEach(() => {
      // Sign in before each test
      cy.visit('/create');
      cy.get('#sign-in-button').click();
      cy.get('#email-input').click().type(testEmail);
      cy.get('#password-input').click().type(testPassword);
      cy.get('#create-account-button').click();
      cy.wait(2000); // Wait for authentication
    });

    it('should show referral dialog with stats for signed-in users', () => {
      cy.visit('/create');
      
      // Open profile menu
      cy.get('#menu-button').click();
      
      // Click on "Refer & Earn" menu item
      cy.contains('Refer & Earn').click();
      
      // Verify dialog opens
      cy.contains('Refer & earn credits').should('be.visible');
      
      // Verify "How it works" section is shown
      cy.contains('How it works').should('be.visible');
      cy.contains('Share your link with other teams, scrum masters, or agile coaches').should('be.visible');
      cy.contains('When they make their first purchase, you both earn').should('be.visible');
      
      // Verify "Your Referral Link" section is shown
      cy.contains('Your Referral Link').should('be.visible');
      cy.get('.link-input').should('be.visible');
      
      // Verify "Your Referral Stats" section is shown
      cy.contains('Your Referral Stats').should('be.visible');
      cy.contains('Total Referrals').should('be.visible');
      cy.contains('Pending Credits').should('be.visible');
      cy.contains('Credits Earned').should('be.visible');
      
      // Verify anonymous prompt is NOT shown
      cy.contains('Create an account to start earning').should('not.exist');
    });

    it('should copy referral link to clipboard when clicked', () => {
      cy.visit('/create');
      
      // Open referral dialog
      cy.get('#menu-button').click();
      cy.contains('Refer & Earn').click();
      
      // Get the referral link value
      cy.get('.link-input').invoke('val').then((linkValue) => {
        // Verify it's a valid URL with referral parameter
        expect(linkValue).to.include('?referral=');
        
        // Click the copy button
        cy.get('button[mattooltip="Copy to clipboard"]').click();
        
        // Verify toast message appears
        cy.contains('Referral link copied to clipboard').should('be.visible');
      });
    });

    it('should show referral button in My Account dialog', () => {
      cy.visit('/create');
      
      // Open profile menu
      cy.get('#menu-button').click();
      
      // Click "My account"
      cy.get('#account-menu-item').click();
      
      // Navigate to Credits tab
      cy.contains('Credits').click();
      
      // Verify "Refer & earn" button is present
      cy.contains('button', 'Refer & earn').should('be.visible');
      
      // Click the button
      cy.contains('button', 'Refer & earn').click();
      
      // Verify referral dialog opens
      cy.contains('Refer & earn credits').should('be.visible');
      cy.contains('Your Referral Link').should('be.visible');
    });

    it('should display referral stats correctly', () => {
      cy.visit('/create');
      
      // Open referral dialog
      cy.get('#menu-button').click();
      cy.contains('Refer & Earn').click();
      
      // Verify stats cards are present
      cy.get('.stat-card').should('have.length', 3);
      
      // Verify each stat has a value and label
      cy.get('.stat-card').each(($card) => {
        cy.wrap($card).find('.stat-value').should('exist');
        cy.wrap($card).find('.stat-label').should('exist');
      });
      
      // Verify stat values are numbers
      cy.get('.stat-value').each(($value) => {
        const text = $value.text().trim();
        expect(text).to.match(/^\d+$/);
      });
    });
  });

  describe('Referral Link Validation', () => {
    it('should handle referral parameter in different routes', () => {
      const testCode = 'ROUTE123';
      const routes = ['/create', '/join', '/'];
      
      routes.forEach((route) => {
        cy.clearCookie('pp_referral');
        cy.window().then((win) => win.localStorage.removeItem('pp_referral'));
        
        cy.visit(`${route}?referral=${testCode}`);
        cy.wait(3000);

        cy.getCookie('pp_referral').should('have.property', 'value', testCode);
      });
    });
  });
});
