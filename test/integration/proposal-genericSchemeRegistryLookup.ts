import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { getArc } from "./utils";

describe("Proposals ENS", () => {

  beforeEach(async () => {
    const arc = getArc();

    const daos = await arc.daos({ where: { name: "Nectar DAO"}}).pipe(first()).toPromise();
    const dao = daos[0];
    const url = `/dao/${dao.id}/`;
    await browser.url(url);

    const ensTitle = await $("h2=RegistryLookup");
    await ensTitle.waitForExist();
    await ensTitle.click();

    // const acceptCookiesButton = await $("*[data-test-id=\"acceptCookiesButton\"]")
    // if (acceptCookiesButton.isExisting()) {
    //   await acceptCookiesButton.click()
    // }

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

  });

  it("Create a Generic Scheme RegistryLookup proposal to add tokens", async () => {
  //
    const masterCopyTab = await $("*[data-test-id=\"action-tab-addNewTokens\"]");
    await masterCopyTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    // using uuid value so that the test will pass also if there is already a proposal with this description
    // (which must be unique).
    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const tokens0Input = await $("*[id=\"_tokens.0\"]");
    await tokens0Input.setValue("0x501eab934f76b876c116cfffb511f5a065ea7944");

    const tokensAdd = await $("*[data-test-id=\"_tokens.add\"]");
    await tokensAdd.click();
    const tokens1Input = await $("*[id=\"_tokens.1\"]");
    await tokens1Input.setValue("0x501eab934f76b876c116cfffb511f5a065ea7945");

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
    // await titleElement.scrollIntoView(false);
    // await titleElement.click();
    //
    // const summaryDetailsElement = await $("[class*=\"summaryDetails\"]");
    // await summaryDetailsElement.waitForExist();
  });

  it("Create a Generic Scheme RegistryLookup proposal to delete tokens", async () => {

    const masterCopyTab = await $("*[data-test-id=\"action-tab-removeTokens\"]");
    await masterCopyTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    // using uuid value so that the test will pass also if there is already a proposal with this description
    // (which must be unique).
    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const tokens0Input = await $("*[id=\"_tokens.0\"]");
    await tokens0Input.setValue("0x501eab934f76b876c116cfffb511f5a065ea7944");

    const tokensAdd = await $("*[data-test-id=\"_tokens.add\"]");
    await tokensAdd.click();
    const tokens1Input = await $("*[id=\"_tokens.1\"]");
    await tokens1Input.setValue("0x501eab934f76b876c116cfffb511f5a065ea7945");
    //
    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();
    //
    // // check that the proposal appears in the list
    // // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
    // await titleElement.scrollIntoView(false);
    // await titleElement.click();
    //
    // const summaryDetailsElement = await $("[class*=\"summaryDetails\"]");
    // await summaryDetailsElement.waitForExist();

  });


});
