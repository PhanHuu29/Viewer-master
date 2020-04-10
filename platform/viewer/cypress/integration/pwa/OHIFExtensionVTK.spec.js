describe('OHIF VTK Extension', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1'
    );
    cy.expectMinimumThumbnails(20);
    // Wait for all thumbnails to finish loading
    // This will make this test less flaky
    cy.wait(2000);

    //Waiting for the desired thumbnail content to be displayed
    cy.get('[data-cy="thumbnail-list"]', { timeout: 15000 }).should($list => {
      expect($list).to.contain('CT WB 5.0  B35f');
    });

    // TODO: We shouldn't have to drag the thumbnail
    // This is a known bug; 2D MPR button does not show until viewport
    // has data from a drag-n-drop
    // Drag and drop third thumbnail into first viewport
    cy.get('[data-cy="thumbnail-list"]')
      .contains('CT WB 5.0  B35f')
      .drag('.viewport-drop-target');

    //Select 2D MPR button
    cy.get('[data-cy="2d mpr"]').click();

    //Wait Reformatting Images
    cy.waitVTKReformatting();
  });

  beforeEach(() => {
    cy.initVTKToolsAliases();
  });

  it('checks if VTK buttons are displayed on the toolbar', () => {
    cy.get('@crosshairsBtn')
      .should('be.visible')
      .contains('Crosshairs');
    cy.get('@wwwcBtn')
      .should('be.visible')
      .contains('WWWC');
    cy.get('@rotateBtn')
      .should('be.visible')
      .contains('Rotate');
    cy.get('@slabSlider')
      .should('be.visible')
      .contains('Slab Thickness');
    cy.get('@modeDropdown')
      .should('be.visible')
      .contains('MIP');
    cy.get('@modeCheckbox').should('be.visible');
    cy.get('@layoutBtn')
      .should('be.visible')
      .contains('Layout');
  });

  it('checks WWWC tool', () => {
    cy.get('@wwwcBtn').click();

    //Initial label in the viewport
    const initialLabelText = 'W: 350 L: 40';

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup', { which: 1 })
      .then(() => {
        cy.get('.ViewportOverlay > div.bottom-right.overlay-element').should(
          'not.have.text',
          initialLabelText
        );
      });
  });
});
