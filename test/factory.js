const BPool = artifacts.require('BPool');
const BFactory = artifacts.require('BFactory');
const TToken = artifacts.require('TToken');
const truffleAssert = require('truffle-assertions');

contract('BFactory', async (accounts) => {
    const admin = accounts[0];
    const nonAdmin = accounts[1];
    const user2 = accounts[2];
    const reserveAddress = accounts[3];
    const { toWei } = web3.utils;
    const { fromWei } = web3.utils;
    const { hexToUtf8 } = web3.utils;

    const MAX = web3.utils.toTwosComplement(-1);

    describe('Factory', () => {
        let factory;
        let pool;
        let POOL;
        let WETH;
        let DAI;
        let weth;
        let dai;

        before(async () => {
            factory = await BFactory.deployed();
            weth = await TToken.new('Wrapped Ether', 'WETH', 18);
            dai = await TToken.new('Dai Stablecoin', 'DAI', 18);

            WETH = weth.address;
            DAI = dai.address;

            // admin balances
            await weth.mint(admin, toWei('5'));
            await dai.mint(admin, toWei('200'));

            // nonAdmin balances
            await weth.mint(nonAdmin, toWei('1'), { from: admin });
            await dai.mint(nonAdmin, toWei('50'), { from: admin });

            POOL = await factory.newBPool.call(); // this works fine in clean room
            await factory.newBPool();
            pool = await BPool.at(POOL);

            await weth.approve(POOL, MAX);
            await dai.approve(POOL, MAX);

            await weth.approve(POOL, MAX, { from: nonAdmin });
            await dai.approve(POOL, MAX, { from: nonAdmin });
        });

        it('BFactory is bronze release', async () => {
            const color = await factory.getColor();
            assert.equal(hexToUtf8(color), 'BRONZE');
        });

        it('isBPool on non pool returns false', async () => {
            const isBPool = await factory.isBPool(admin);
            assert.isFalse(isBPool);
        });

        it('isBPool on pool returns true', async () => {
            const isBPool = await factory.isBPool(POOL);
            assert.isTrue(isBPool);
        });

        it('fails nonAdmin calls collect', async () => {
            await truffleAssert.reverts(factory.collect(nonAdmin, { from: nonAdmin }));
        });

        it('admin fails to collect non pool', async () => {
            const nonPool = accounts[4];
            await truffleAssert.reverts(
                factory.collect(nonPool),
            );
        });

        it('admin collects fees', async () => {
            await pool.bind(WETH, toWei('5'), toWei('5'));
            await pool.bind(DAI, toWei('200'), toWei('5'));

            await pool.finalize();

            await pool.joinPool(toWei('10'), [MAX, MAX], { from: nonAdmin });
            await pool.exitPool(toWei('10'), [toWei('0'), toWei('0')], { from: nonAdmin });

            // Exit fee = 0 so this wont do anything
            await factory.collect(POOL);

            const adminBalance = await pool.balanceOf(admin);
            assert.equal(fromWei(adminBalance), '100');
        });

        /* allowNonAdminPool */

        it('by default nonadmin cant create new pools but admin can', async () => {
            assert.isFalse(await factory.getAllowNonAdminPool());
            await truffleAssert.reverts(factory.newBPool({ from: nonAdmin }));
            await factory.newBPool({ from: admin });
        });

        it('nonadmin cant set _allowNonAdminPool', async () => {
            await truffleAssert.reverts(factory.setAllowNonAdminPool(true, { from: nonAdmin }));
            await truffleAssert.reverts(factory.setAllowNonAdminPool(false, { from: nonAdmin }));
        });

        it('admin can set _allowNonAdminPool', async () => {
            await factory.setAllowNonAdminPool(true, { from: admin });
            assert.isTrue(await factory.getAllowNonAdminPool());
        });

        it('both admin and nonadmin can create new pools after _allowNonAdminPool is set to true', async () => {
            await factory.newBPool({ from: nonAdmin });
            await factory.newBPool({ from: admin });
        });

        it('only admin can create new pools after _allowNonAdminPool is set to false again', async () => {
            await factory.setAllowNonAdminPool(false, { from: admin });
            await truffleAssert.reverts(factory.newBPool({ from: nonAdmin }));
            await factory.newBPool({ from: admin });
        });

        /* blabs address */

        it('nonadmin cant set blabs address', async () => {
            await truffleAssert.reverts(factory.setBLabs(nonAdmin, { from: nonAdmin }));
        });

        it('admin changes blabs address', async () => {
            await factory.setBLabs(user2);
            const blab = await factory.getBLabs();
            assert.equal(blab, user2);
        });

        // admin is changed in the test above
        const newAdmin = user2;

        /* reservesAddress */

        it('`getReservesAddress` is default to be the original `_blabs`', async () => {
            const r = await factory.getReservesAddress.call();
            assert.equal(r, admin);
        });

        it('nonadmin cant set reservesAddress', async () => {
            await truffleAssert.reverts(factory.setReservesAddress(nonAdmin, { from: nonAdmin }));
        });

        it('admin changes reservesAddress', async () => {
            await factory.setReservesAddress(reserveAddress, { from: newAdmin });
            const r = await factory.getReservesAddress();
            assert.equal(r, reserveAddress);
        });

        /* collectTokenReserves */
        it('nonadmin fails to collect totalReserves tokens', async () => {
            await truffleAssert.reverts(factory.collectTokenReserves(POOL, { from: nonAdmin }));
        });

        it('admin fails to collect non pool', async () => {
            const nonPool = accounts[4];
            await truffleAssert.reverts(
                factory.collectTokenReserves(nonPool, { from: newAdmin }),
            );
        });

        it('admin collects totalReserves tokens', async () => {
            await factory.collectTokenReserves(POOL, { from: newAdmin });
        });
    });
});
