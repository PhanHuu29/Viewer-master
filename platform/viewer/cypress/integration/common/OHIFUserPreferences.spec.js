describe('OHIF User Preferences', () => {
  context('Study List Page', function() {
    before(() => {
      cy.visit('/');
    });

    beforeEach(() => {
      // Open User Preferences modal
      cy.openPreferences();
      cy.initPreferencesModalAliases();
    });

    it('checks displayed information on User Preferences modal', function() {
      cy.get('@preferencesModal').should('contain.text', 'User Preferences');
      cy.get('@userPreferencesHotkeysTab')
        .should('have.text', 'Hotkeys')
        .and('have.class', 'active');
      cy.get('@userPreferencesGeneralTab').should('have.text', 'General');
      cy.get('@restoreBtn')
        .scrollIntoView()
        .should('have.text', 'Reset to Defaults');
      cy.get('@cancelBtn').should('have.text', 'Cancel');
      cy.get('@saveBtn').should('have.text', 'Save');

      // Visual comparison
      cy.screenshot(
        'User Preferences Modal - Hotkeys tab initial state in Study Viewer page'
      );
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Hotkeys tab initial state in Study Viewer page'
      );
      cy.get('.close').click();
    });

    it('checks translation by selecting Spanish language', function() {
      cy.get('@userPreferencesGeneralTab')
        .click()
        .should('have.class', 'active');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Visual comparison
      cy.screenshot(
        'User Preferences Modal - General tab initial state in Study Viewer page'
      );
      cy.percyCanvasSnapshot(
        'User Preferences Modal - General tab initial state in Study Viewer page'
      );
      // Select Spanish and Save
      cy.get('#language-select').select('Spanish');
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Header should be translated to Spanish
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'SOLO USO PARA INVESTIGACIÓN');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]').should('have.text', 'Opciones');

      //TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
      //Once the issue is fixed, the following code should be uncommented
      // cy.get('[data-cy="about-item-menu"]')
      //   .first()
      //   .should('have.text', 'Acerca de');
      // cy.get('[data-cy="about-item-menu"]')
      //   .last()
      //   .should('have.text', 'Preferencias');
    });

    it('checks if user can cancel the language selection and application will be in English', function() {
      cy.get('@userPreferencesGeneralTab')
        .click()
        .should('have.class', 'active');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Select Spanish and Cancel
      cy.get('#language-select').select('Spanish');
      cy.get('@cancelBtn')
        .scrollIntoView()
        .click();

      // TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
      // Once the issue is fixed, the following code should be uncommented
      // // Header should be kept in English
      // cy.get('.research-use')
      //   .scrollIntoView()
      //   .should('have.text', 'INVESTIGATIONAL USE ONLY');
      //
      // // Options menu should be translated
      // cy.get('[data-cy="options-menu"]').should('have.text', 'Options');
      //
      // cy.get('[data-cy="about-item-menu"]')
      //   .first()
      //   .should('have.text', 'About');
      // cy.get('[data-cy="about-item-menu"]')
      //   .last()
      //   .should('have.text', 'Preferences');
    });

    // TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
    // Once the issue is fixed, the following code should be uncommented
    // it('checks if user can restore to default the language selection and application will be in English', function() {
    //   cy.get('@userPreferencesGeneralTab')
    //     .click()
    //     .should('have.class', 'active');

    //   // Language dropdown should be displayed
    //   cy.get('#language-select').should('be.visible');

    //   // Select Spanish and Save
    //   cy.get('#language-select').select('Spanish');
    //   cy.get('@saveBtn')
    //     .scrollIntoView()
    //     .click();

    //   //Open Preferences again
    //   cy.openPreferences();

    //   // Go to general tab
    //   cy.get('@userPreferencesGeneralTab').click();

    //   cy.get('@restoreBtn')
    //     .scrollIntoView()
    //     .click();

    // Header should be in English
    // cy.get('.research-use')
    //   .scrollIntoView()
    //   .should('have.text', 'INVESTIGATIONAL USE ONLY');
    //
    // Options menu should be in English
    //   cy.get('[data-cy="options-menu"]').should('have.text', 'Options');
    //   cy.get('[data-cy="about-item-menu"]')
    //     .first()
    //     .should('have.text', 'About');
    //   cy.get('[data-cy="about-item-menu"]')
    //     .last()
    //     .should('have.text', 'Preferences');
    //  });

    it('checks if Preferences set in Study List Page will be consistent on Viewer Page', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab')
        .click()
        .should('have.class', 'active');

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{shift}Q'
      );
      // Save new hotkey
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Open User Preferences modal again
      cy.openPreferences();

      // Go to General tab
      cy.get('@userPreferencesGeneralTab').click();

      // Select Spanish and Save
      cy.get('#language-select').select('Spanish');
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Go to Study Viewer page
      cy.openStudy('MISTER^MR');
      cy.waitDicomImage();
      cy.expectMinimumThumbnails(5);
      cy.initCommonElementsAliases();

      // Check if application is in Spanish
      // Header should be translated to Spanish
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'SOLO USO PARA INVESTIGACIÓN');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Opciones')
        .click();
      cy.get('[data-cy="about-item-menu"]')
        .first()
        .should('contain.text', 'Acerca de');
      cy.get('[data-cy="options-menu"]').click(); //Close Options overlay

      //TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
      //Once the issue is fixed, the following code should be uncommented
      // cy.get('[data-cy="about-item-menu"]')
      //   .last()
      //   .should('have.text', 'Preferencias');

      // Check if new hotkey is working on viewport
      cy.get('body').type('{shift}Q', { release: false });
      cy.get('@viewportInfoMidTop').should('contains.text', 'R');
    });
  });

  context('Study Viewer Page', function() {
    before(() => {
      cy.openStudy('MISTER^MR');
      cy.waitDicomImage();
      cy.expectMinimumThumbnails(3);
    });

    beforeEach(() => {
      cy.initCommonElementsAliases();
      cy.resetViewport();
      cy.wait(200);
      cy.resetUserHoktkeyPreferences();
      // Open User Preferences modal
      cy.openPreferences();
    });

    it('checks displayed information on User Preferences modal', function() {
      cy.get('@preferencesModal').should('contain.text', 'User Preferences');
      cy.get('@userPreferencesHotkeysTab')
        .should('have.text', 'Hotkeys')
        .and('have.class', 'active');
      cy.get('@userPreferencesGeneralTab').should('have.text', 'General');
      cy.get('@restoreBtn')
        .scrollIntoView()
        .should('have.text', 'Reset to Defaults');
      cy.get('@cancelBtn').should('have.text', 'Cancel');
      cy.get('@saveBtn').should('have.text', 'Save');

      // Visual comparison
      cy.screenshot(
        'User Preferences Modal - Hotkeys tab initial state in Study List page'
      );
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Hotkeys tab initial state in Study List page'
      );
      cy.get('.close').click(); //close User Preferences modal
    });

    it('checks translation by selecting Spanish language', function() {
      cy.get('@userPreferencesGeneralTab')
        .click()
        .should('have.class', 'active');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Visual comparison
      cy.screenshot(
        'User Preferences Modal - General tab initial state in Study List page'
      );
      cy.percyCanvasSnapshot(
        'User Preferences Modal - General tab initial state in Study List page'
      );
      // Select Spanish and Save
      cy.get('#language-select').select('Spanish');
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Header should be translated to Spanish
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'SOLO USO PARA INVESTIGACIÓN');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]').should('have.text', 'Opciones');

      //TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
      //Once the issue is fixed, the following code should be uncommented
      // cy.get('[data-cy="about-item-menu"]')
      //   .first()
      //   .should('have.text', 'Acerca de');
      // cy.get('[data-cy="about-item-menu"]')
      //   .last()
      //   .should('have.text', 'Preferencias');
    });

    it('checks if user can cancel the language selection and application will be in English', function() {
      cy.get('@userPreferencesGeneralTab')
        .click()
        .should('have.class', 'active');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Select Spanish and Cancel
      cy.get('#language-select').select('Spanish');
      cy.get('@cancelBtn')
        .scrollIntoView()
        .click();

      // TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
      // Once the issue is fixed, the following code should be uncommented
      // // Header should be kept in English
      // cy.get('.research-use')
      //   .scrollIntoView()
      //   .should('have.text', 'INVESTIGATIONAL USE ONLY');
      //
      // // Options menu should be translated
      // cy.get('[data-cy="options-menu"]').should('have.text', 'Options');
      //
      // cy.get('[data-cy="about-item-menu"]')
      //   .first()
      //   .should('have.text', 'About');
      // cy.get('[data-cy="about-item-menu"]')
      //   .last()
      //   .should('have.text', 'Preferences');
    });

    // TODO: the following code is blocked by issue 1193: https://github.com/OHIF/Viewers/issues/1193
    // Once the issue is fixed, the following code should be uncommented
    // it('checks if user can restore to default the language selection and application will be in English', function() {
    //   cy.get('@userPreferencesGeneralTab')
    //     .click()
    //     .should('have.class', 'active');

    //   // Language dropdown should be displayed
    //   cy.get('#language-select').should('be.visible');

    //   // Select Spanish and Save
    //   cy.get('#language-select').select('Spanish');
    //   cy.get('@saveBtn')
    //     .scrollIntoView()
    //     .click();

    //   //Open Preferences again
    //   cy.get('[data-cy="options-menu"]')
    //     .scrollIntoView()
    //     .click();
    //   cy.get('[data-cy="about-item-menu"]')
    //     .last()
    //     .click();

    //   // Go to general tab
    //   cy.get('@userPreferencesGeneralTab').click();

    //   cy.get('@restoreBtn')
    //     .scrollIntoView()
    //     .click();

    // Header should be in English
    // cy.get('.research-use')
    //   .scrollIntoView()
    //   .should('have.text', 'INVESTIGATIONAL USE ONLY');
    //
    // Options menu should be in English
    //   cy.get('[data-cy="options-menu"]').should('have.text', 'Options');
    //   cy.get('[data-cy="about-item-menu"]')
    //     .first()
    //     .should('have.text', 'About');
    //   cy.get('[data-cy="about-item-menu"]')
    //     .last()
    //     .should('have.text', 'Preferences');
    //});

    it('checks new hotkeys for "Rotate Right" and "Rotate Left"', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab')
        .click()
        .should('have.class', 'active');

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{shift}{rightarrow}'
      );
      // Set new hotkey for 'Rotate Left' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Rotate Left',
        '{shift}{leftarrow}'
      );

      //Save new hotkeys
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      //Rotate Right with new Hotkey
      cy.get('body').type('{shift}{rightarrow}');
      cy.get('@viewportInfoMidTop').should('contains.text', 'R');

      //Rotate Left with new Hotkey
      cy.get('body').type('{shift}{leftarrow}');
      cy.get('@viewportInfoMidTop').should('contains.text', 'A');
    });

    it('checks new hotkeys for "Next" and "Previous" Image on Viewport', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab')
        .click()
        .should('have.class', 'active');

      // Set new hotkey for 'Next Image Viewport' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Next Image Viewport',
        '{shift}{rightarrow}'
      );

      // Set new hotkey for 'Previous Image Viewport' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Previous Image Viewport',
        '{shift}{leftarrow}'
      );

      // Save new hotkeys
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Set 3 viewports layout
      cy.setLayout(3, 1);

      // Rotate Right and Invert colors on Viewport #1
      cy.get('body').type('RI');
      // Check that image was rotated
      cy.get('@viewportInfoMidTop').should('contains.text', 'R');

      //Move to Next Viewport
      cy.get('body').type('{shift}{rightarrow}');
      // Rotate Left and Invert colors on Viewport #2
      cy.get('body').type('LI');
      // Get overlay information from viewport #2
      cy.get(
        ':nth-child(2) > .viewport-wrapper > .viewport-element > .ViewportOrientationMarkers.noselect > .top-mid.orientation-marker'
      ).as('viewport2InfoMidTop');
      // Check that image was rotated
      cy.get('@viewport2InfoMidTop').should('contains.text', 'P');

      //Move to Previous Viewport
      cy.get('body').type('{shift}{leftarrow}');
      // Reset viewport #1 with spacebar hotkey
      cy.get('body').type(' ');
      cy.get('@viewportInfoMidTop').should('contains.text', 'A');

      // Visual comparison
      cy.screenshot('Viewport Navigation - 2nd viewport inverted and rotated');
      cy.percyCanvasSnapshot(
        'Viewport Navigation - 2nd viewport inverted and rotated'
      );
      // Set 1 viewport layout
      cy.setLayout(1, 1);
    });

    it('checks error message when duplicated hotkeys are inserted', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab').click();

      // Set duplicated hotkey for 'Rotate Right' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{rightarrow}'
      );

      // Check error message
      cy.get('.modal-body').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('.errorMessage')
          .as('errorMsg')
          .should(
            'have.text',
            '"Next Image Viewport" is already using the "right" shortcut.'
          );
      });
      //Cancel hotkeys
      cy.get('@cancelBtn')
        .scrollIntoView()
        .click();
    });

    it('checks error message when invalid hotkey is inserted', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab').click();

      // Set invalid hotkey for 'Rotate Right' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal('Rotate Right', '{ctrl}Z');

      // Check error message
      cy.get('.modal-body').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('.errorMessage')
          .as('errorMsg')
          .should('have.text', '"ctrl+z" shortcut combination is not allowed');
      });

      //Cancel hotkeys
      cy.get('@cancelBtn')
        .scrollIntoView()
        .click();
    });

    it('checks error message when only modifier keys are inserted', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab').click();

      // Set invalid modifier key: ctrl
      cy.setNewHoktkeyShortcutOnUserPreferencesModal('Zoom Out', '{ctrl}');
      // Check error message
      cy.get('.modal-body').within(() => {
        cy.contains('Zoom Out') // label we're looking for
          .parent()
          .find('.errorMessage')
          .as('errorMsg')
          .should(
            'have.text',
            "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut"
          );
      });

      // Set invalid modifier key: shift
      cy.setNewHoktkeyShortcutOnUserPreferencesModal('Zoom Out', '{shift}');
      // Check error message
      cy.get('@errorMsg').should(
        'have.text',
        "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut"
      );

      // Set invalid modifier key: alt
      cy.setNewHoktkeyShortcutOnUserPreferencesModal('Zoom Out', '{alt}');
      // Check error message
      cy.get('@errorMsg').should(
        'have.text',
        "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut"
      );

      //Cancel hotkeys
      cy.get('@cancelBtn')
        .scrollIntoView()
        .click();
    });

    it('checks if user can cancel changes made on User Preferences Hotkeys tab', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab').click();

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{ctrl}{shift}S'
      );

      //Cancel hotkeys
      cy.get('@cancelBtn')
        .scrollIntoView()
        .click();

      // Open User Preferences modal again
      cy.openPreferences();

      //Check that hotkey for 'Rotate Right' function was not changed
      cy.get('.modal-body').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('input')
          .should('have.value', 'r');
      });
      cy.get('.close').click();
    });

    it('checks if user can reset to default values on User Preferences Hotkeys tab', function() {
      // Go go hotkeys tab
      cy.get('@userPreferencesHotkeysTab').click();

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHoktkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{ctrl}{shift}S'
      );

      //Save hotkeys
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Open User Preferences modal again
      cy.openPreferences();

      //Restore Default hotkeys
      cy.get('@restoreBtn')
        .scrollIntoView()
        .click();

      // Open User Preferences modal again
      cy.openPreferences();

      //Check that hotkey for 'Rotate Right' function was not changed
      cy.get('.modal-body').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('input')
          .should('have.value', 'r');
      });
      cy.get('.close').click();
    });
  });
});
