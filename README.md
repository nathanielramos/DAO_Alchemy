# Alchemy Client

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful to manage different versions of node
* [NodeJS 9.4 or greater + NPM](https://github.com/creationix/nvm#usage)
* You will also need [alchemy-server](https://github.com/daostack/alchemy-server) running locally to save and display proposal titles and descriptions

## Installation
* `npm install`

# Run app locally

## Run the Alchemy Server
1. If you want to be able to save and display the proposal titles and descriptions you will need the Alchemy Server app running.
2. Follow instructions [here](https://github.com/daostack/alchemy-server)

## Working with Ganache without MetaMask
1. Make sure plugins such as MetaMask or Parity extension are deactivated
2. Run `npm run auto-start-ganache`
3. Go to http://localhost:3000/ in your favorite browser

## Working with Ganache and MetaMask
1. Install and Enable the [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
2. Run `npm run ganacheDb` in one terminal tab
3. In a separate tab run `npm run migrate-ganache`
4. Run `npm run start-ganache`
5. Go to http://localhost:3000/ in Chrome
6. Click on the MetaMask extension icon in the toolbar
7. Click on Restore from Seed Phrase
8. Enter `behave pipe turkey animal voyage dial relief menu blush match jeans general` into the box labeled Wallet Seed, and any password you want.
9. Now all transactions will require confirmation through MetaMask

## Working with Kovan testnet and Parity locally
1. Install parity - `bash <(curl https://get.parity.io -Lk)`
2. Create a file in the root of the project called 'kovan_pass.txt' with your parity wallet password
3. Run `parity --no-warp --unlock KOVAN_ACCOUNT_PUBLIC_ADDRESS --password kovan_pass.txt --chain=kovan` in one terminal tab
4. Run `npm run start-kovan` in a separate tab
5. Go to http://localhost:3000/ in your favorite browser

# Regular end users - use MetaMask

* Go to https://alchemy.daostack.io
* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)
* In MetaMask switch to the desired network. Note that we are only deployed on Kovan right now.
* Unlock your account
