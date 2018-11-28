const uuid = require('uuid')

describe('Sanity', () => {
    before(() => {
      var chai = require('chai');
      global.expect = chai.expect;
      chai.Should();
      browser.url('http://0.0.0.0:3000/')
    });

    it('Go through the flow', async () => {
      browser.getTitle().should.be.equal('Alchemy | DAOstack')
      console.log(browser.getText('div'))
      browser.waitForExist('*[data-test-id="link-to-alchemy"]')
      browser.click('*[data-test-id="link-to-alchemy"]')
      browser.waitForExist('*[data-test-id="header-all-daos"]')
      browser.click('*[data-test-id="dao-link"]')
      browser.click('*[data-test-id="skip-tour"]')
      browser.click('*[data-test-id="create-proposal"]')
      browser.setValue('*[id="titleInput"]', 'Free Edward Snowden')
      // using uuid value so that the test will pass also if there is already a proposal with thi description
      // (which must be unique). TODO: find a way to reset the state
      browser.setValue('*[id="descriptionInput"]', `https://this.must.be/a/valid/url${uuid()}`)
      browser.setValue('*[id="beneficiaryInput"]', '0x5fB320886aF629122736c0e1a5c94dCE841EA37B')
      // ask for 100 rep
      browser.setValue('*[id="reputationChangeInput"]', '100')
      browser.click('*[type="submit"]')
      // we shoudl now see a dialog asking us to "launch metamask"
      browser.click('*[data-test-id="launch-metamask"]')
      // since we are working with unlocked accounts (are we?) and we do not haver metamask installed
      // we do not need to confirm at all..
      browser.waitForExist('*[data-test-id="proposal-title"]')
      browser.getText('*[data-test-id="proposal-title"]').should.be.equal('Free Edward Snowden')
      browser.getText('*[data-test-id="proposal-closes-in"]').should.be.equal('CLOSES IN 21 DAYS')
    });
});
