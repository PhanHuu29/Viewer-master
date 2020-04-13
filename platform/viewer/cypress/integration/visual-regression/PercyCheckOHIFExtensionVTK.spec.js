describe('Visual Regression - OHIF VTK Extension', () => {
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

    // Drag and drop thumbnail into viewport
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
    cy.wait(2000); //Wait toolbar to finish loading
  });

  it('checks if VTK buttons are displayed on the toolbar', () => {
    cy.get('@crosshairsBtn').should('be.visible');
    cy.get('@wwwcBtn').should('be.visible');
    cy.get('@rotateBtn').should('be.visible');
    cy.get('@slabSlider').should('be.visible');
    cy.get('@modeDropdown').should('be.visible');
    cy.get('@modeCheckbox').should('be.visible');
    // Visual comparison
    cy.percyCanvasSnapshot(
      'VTK initial state - Should display toolbar and 3 viewports'
    );
  });

  it('checks Crosshairs tool', () => {
    cy.get('@crosshairsBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup');

    // Visual comparison
    cy.percyCanvasSnapshot(
      "VTK Crosshairs tool - Should display crosshairs' green lines"
    );
  });

  it('checks Rotate tool', () => {
    cy.get('@rotateBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup', { which: 1 });

    // Visual comparison
    cy.percyCanvasSnapshot('VTK Rotate tool - Should rotate image');
  });

  it('checks WWWC tool', () => {
    cy.get('@wwwcBtn').click();

    // Click and Move the mouse inside the viewport
    cy.get('[data-cy="viewport-container-0"]')
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mousedown', 'center', { which: 1 })
      .trigger('mousemove', 'top', { which: 1 })
      .trigger('mouseup', { which: 1 });

    // Visual comparison
    cy.percyCanvasSnapshot('VTK WWWC tool - Canvas should be bright');
  });
});
