const { assert, use } = require('chai');
const { constants, BN } = require('openzeppelin-test-helpers');

const BaseToken = artifacts.require('BaseToken');
// const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-as-promised'))
    .should();


contract('BaseToken', accounts => {
    let token;

    const _name = "BaseToken";
    const _symbol = "BT";
    const _decimals = 18;
    const _total_supply = 50 * 100000000; // 50억
    // const _total_supply = 5000000000; // 50억
    // const _total_supply = new BigNumber(50 * 100000000); // 50억

    const owner = accounts[0];
    const admin = accounts[1];

    before(() => { });
    beforeEach(async () => {
        token = await BaseToken.new(_name, _symbol, _decimals, _total_supply, { from: owner });
    });
    afterEach(() => { });
    after(() => { });
    describe('test 1', () => {
        it('test 1-1', async () => {
            // await token.appointAdmin(admin, { from: admin }).should.be.fulfilled;
            // await token.appointAdmin(admin, { from: admin }).should.be.rejectedWith('caller is not the owner');
            // await assert.isFulfilled(token.appointAdmin(admin, { from: owner }));

            // assert.equal(await token.totalSupply(), _total_supply, "total not equal");
        });
    })
    describe('기능 Test', () => {
        it('기본 값', async () => {
            assert.equal(_name, await token.name(), "name not equal");
            assert.equal(_symbol, await token.symbol(), "symbold not equal");
            assert.equal(_decimals, await token.decimals(), "decimals not equal");
            assert.equal(_total_supply, await token.totalSupply(), "totalSupply not equal");
            assert.equal(owner, await token.owner(), "owner not equal");

        });

        it('Transfer', async () => {
            let amount = 1000;

            // assert.isRejected(token.transfer(admin, amount, { from: constants.ZERO_ADDRESS }), "ERC20: transfer from the zero address"); // @dev Node가 에러난다.
            // await assert.isRejected(token.transfer(constants.ZERO_ADDRESS, amount, { from: owner }), "ERC20: transfer to the zero address");
            await token.transfer(constants.ZERO_ADDRESS, amount, { from: owner }).should.be.rejectedWith("ERC20: transfer to the zero address");
            // await assert.isFulfilled(token.transfer(admin, amount, { from: owner }));
            await token.transfer(admin, amount, { from: owner }).should.be.fulfilled;
            assert.equal(amount, await token.balanceOf(admin), "balance not equal");

            await assert.isRejected(token.transfer(admin, amount + 1, { from: admin }), "ERC20: transfer amount exceeds balance");
            // await token.transfer(admin, amount + 1, { from: admin }).should.be.rejectedWith("ERC20: transfer amount exceeds balance");
            // await assert.isFulfilled(token.transfer(accounts[2], amount, { from: admin }));
            await token.transfer(accounts[2], amount, { from: admin }).should.be.fulfilled;

            assert.equal(0, (await token.balanceOf(admin)).toNumber(), 'balance not equal');

            await assert.isFulfilled(token.transfer(admin, amount, { from: owner }));
            await assert.isFulfilled(token.transfer(accounts[2], amount / 2, { from: admin }));
            await assert.isFulfilled(token.transfer(accounts[3], amount / 2, { from: accounts[2] }));
            await token.transfer(accounts[4], amount / 4, { from: accounts[3] }).should.be.fulfilled;
        });
        it('Approve', async () => {
            const user = accounts[7];
            const amount = 3000;
            await token.transfer(admin, amount, { from: owner }).should.be.fulfilled;
            // 본인이 가진 토큰량 이상으로 approve 주기 가능
            await token.approve(user, amount + 1, { from: admin }).should.be.fulfilled;
        });
        it('IncreaseAllowance', async () => {
            const user = accounts[7];
            const amount = 3000;
            await token.approve(user, amount + 1, { from: admin }).should.be.fulfilled;
            await token.increaseAllowance(user, amount / 10, { from: admin }).should.be.fulfilled;
        });
        it('DecreaseAllowance', async () => {
            const user = accounts[7];
            const amount = 3000;
            await token.approve(user, amount + 1, { from: admin }).should.be.fulfilled;
            await token.decreaseAllowance(user, amount * 10, { from: admin }).should.be.rejectedWith("ERC20: decreased allowance below zero");
            await token.decreaseAllowance(user, amount / 10, { from: admin }).should.be.fulfilled;
        });
        it('TransferFrom', async () => {
            const user = accounts[7];
            const amount = 3000;
            await token.transfer(admin, amount, { from: owner }).should.be.fulfilled;
            // 본인이 가진 토큰량 이상으로 approve 주기 가능
            await token.approve(user, amount + 1, { from: admin }).should.be.fulfilled;
            // 하지만 transfer는 본인이 가진 토큰량 이상으로 불가능
            await token.transferFrom(admin, accounts[3], amount + 1, { from: user }).should.be.rejectedWith("ERC20: transfer amount exceeds balance");
            await token.transferFrom(admin, accounts[3], amount, { from: user }).should.be.fulfilled;
        });
        it('Mint', async () => {
            // const amount = 500000;
            // await token.mint(owner, amount, { from: owner }).should.be.fulfilled;
            // await token.mint(admin, amount, { from: admin }).should.be.rejectedWith("Ownable: caller is not the owner");
            // await token.mint(admin, amount, { from: owner }).should.be.fulfilled;
        });
        it('Burn', async () => {
            const amount = 500000;
            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;
            await token.transfer(accounts[3], amount, { from: owner }).should.be.fulfilled;
            await token.burn(accounts[3], amount, { from: owner }).should.be.rejectedWith("Ownable: caller is not the admin");
            await token.burn(accounts[3], amount, { from: admin }).should.be.fulfilled;

            // Mint
            await token.mint(owner, amount + 1, { from: owner }).should.be.rejectedWith("totalSupply exceeds maximum");
            await token.mint(owner, amount, { from: owner }).should.be.fulfilled;
        });
        it('Blacklist - single address', async () => {
            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;

            const amount = 500000;
            const user1 = accounts[3];
            const user2 = accounts[7];
            await token.transfer(user1, amount, { from: owner }).should.be.fulfilled;

            await token.transfer(user2, amount / 10, { from: user1 }).should.be.fulfilled;

            await token.addAddressToBlacklist(user1, { from: admin }).should.be.fulfilled;

            await token.transfer(user2, amount / 10, { from: user1 }).should.be.rejectedWith("Blacklist: msg.send is not blacklisted");
        });
        it('Blacklist - array address', async () => {
            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;

            const amount = 500000;
            const users = [accounts[3], accounts[4], accounts[5], accounts[8]];

            await token.transfer(users[1], amount, { from: owner }).should.be.fulfilled;
            await token.transfer(users[3], amount, { from: owner }).should.be.fulfilled;

            await token.transfer(users[0], amount / 10, { from: users[1] }).should.be.fulfilled;
            await token.transfer(users[2], amount / 10, { from: users[3] }).should.be.fulfilled;

            await token.addAddressesToBlacklist(users, { from: admin }).should.be.fulfilled;

            await token.transfer(users[0], amount / 10, { from: users[1] }).should.be.rejectedWith("Blacklist: msg.send is not blacklisted");
            await token.transfer(users[2], amount / 10, { from: users[3] }).should.be.rejectedWith("Blacklist: msg.send is not blacklisted");
        });
        it('Pause', async () => {
            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;

            const amount = 500000;
            const user1 = accounts[3];
            const user2 = accounts[7];
            await token.transfer(user1, amount, { from: owner }).should.be.fulfilled;

            await token.transfer(user2, amount / 10, { from: user1 }).should.be.fulfilled;

            await token.pause({ from: owner }).should.be.fulfilled;

            await token.transfer(user1, amount / 10, { from: owner }).should.be.rejectedWith("Pausable: paused");
            await token.transfer(user2, amount / 10, { from: user1 }).should.be.rejectedWith("Pausable: paused");
        });
        it('Decimals', async () => {
            const originDecimals = 18;
            const testDecimals = 12;

            assert.equal(originDecimals, await token.decimals(), "decimals not equal");

            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;

            // await token.setupDecimals(testDecimals, { from: accounts[3] }).should.be.rejectedWith("Ownable: caller is not the owner");
            // await token.setupDecimals(testDecimals, { from: admin }).should.be.rejectedWith("Ownable: caller is not the owner");
            // await token.setupDecimals(testDecimals, { from: owner }).should.be.fulfilled;
            // assert.equal(testDecimals, await token.decimals(), "decimals not equal");
        });
        it('Privilege', async () => { });
        it('Admin', async () => {
            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;
            assert.equal(admin, await token.admin(), "admin not equal");
            await token.appointAdmin(accounts[2], { from: admin }).should.be.rejectedWith("Ownable: caller is not the owner");
            await token.appointAdmin(accounts[2], { from: owner }).should.be.fulfilled;
            assert.equal(accounts[2], await token.admin(), "admin not equal");
        });
        it('Owner', async () => {
            const newOnwer = accounts[7];
            assert.equal(owner, await token.owner(), "owner not equal");
            await token.transferOwnership(newOnwer, { from: admin }).should.be.rejectedWith("Ownable: caller is not the owner");
            await token.transferOwnership(newOnwer, { from: owner }).should.be.fulfilled;
            assert.equal(newOnwer, await token.owner(), "owner not equal");
        });
        it('totalSupply', async () => {
            await token.appointAdmin(admin, { from: owner }).should.be.fulfilled;
        });
        it('', async () => { });
        it('', async () => { });
        it('', async () => { });
        it('', async () => { });
    });
    describe('시나리오 테스트', () => {

    })
})