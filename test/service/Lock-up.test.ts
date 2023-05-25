import { NonceManager } from "@ethersproject/experimental";
import * as assert from "assert";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, Wallet } from "ethers";
import fs from "fs";
import * as hre from "hardhat";
import { Config } from "../../src/service/common/Config";
import { GasPriceManager } from "../../src/service/contract/GasPriceManager";
import { TestERC20, Lockup } from "../../typechain-types";

chai.use(solidity);

describe("Test of Server", function () {
    const ownerKey = new hre.ethers.Wallet(process.env.MANAGER_KEY || "");
    const minterKey = new hre.ethers.Wallet(process.env.MINTER_KEY || "");
    const testerKey = new hre.ethers.Wallet(process.env.TESTER_KEY || "");
    const provider = hre.ethers.provider;
    let owner = new NonceManager(new GasPriceManager(provider.getSigner(ownerKey.address)));
    const minter = new NonceManager(new GasPriceManager(provider.getSigner(minterKey.address)));
    const tester = new NonceManager(new GasPriceManager(provider.getSigner(testerKey.address)));
    let token: TestERC20;
    let lockup: Lockup;
    let token_address: string;
    let lockup_address: string;
    const TEST_ERC20_ABI = JSON.parse(fs.readFileSync("src/service/contract/ERC20.ABI.json", "utf8"));
    const TEST_LOCKUP_ABI = JSON.parse(fs.readFileSync("src/service/contract/Lockup.ABI.json", "utf8"));

    before("Deploy Test Token", async () => {
        const ContractFactory = await hre.ethers.getContractFactory("TestERC20");
        const contract = (await ContractFactory.connect(owner).deploy("Sample Token", "STK")) as TestERC20;
        await contract.deployed();
        token_address = contract.address;
        token = new hre.ethers.Contract(token_address, TEST_ERC20_ABI, hre.ethers.provider) as TestERC20;
        console.log("Token_address", token_address);

        const LockupContractFactory = await hre.ethers.getContractFactory("Lockup");

        const blockNumBefore = await hre.ethers.provider.getBlockNumber();
        const blockBefore = await hre.ethers.provider.getBlock(blockNumBefore);
        const blockTimestamp = blockBefore.timestamp;

        console.log("Block number :", blockNumBefore);
        console.log("Block timestamp :", blockTimestamp);

        const LockUpcontract = (await LockupContractFactory.connect(owner).deploy(
            token_address,
            blockTimestamp + 3
        )) as Lockup;

        await LockUpcontract.deployed();
        lockup_address = LockUpcontract.address;
        lockup = new hre.ethers.Contract(lockup_address, TEST_LOCKUP_ABI, hre.ethers.provider) as Lockup;
        console.log("Lockup address", lockup_address);

        const minter_signer = new NonceManager(new GasPriceManager(provider.getSigner(minterKey.address)));
        await minter_signer.sendTransaction({
            to: tester.getAddress(),
            value: BigNumber.from(1).mul(BigNumber.from(10).pow(BigNumber.from(18))),
        });
    });

    it("Test the Token balance", async () => {
        console.log("owner :", owner.getAddress(), await hre.ethers.provider.getBalance(owner.getAddress()));
        console.log("minter :", minter.getAddress(), await hre.ethers.provider.getBalance(minter.getAddress()));
        console.log("tester :", tester.getAddress(), await hre.ethers.provider.getBalance(tester.getAddress()));

        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(10000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        // lockup 컨트랙트로 입금
        await token
            .connect(owner)
            .approve(lockup.address, BigNumber.from(100).mul(BigNumber.from(10).pow(BigNumber.from(18))));
        await lockup
            .connect(owner)
            .deposit(tester.getAddress(), BigNumber.from(100).mul(BigNumber.from(10).pow(BigNumber.from(18))));
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(9900).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        // lockup 컨트랙트 잔액 조회
        assert.deepStrictEqual(
            await lockup.getLockedTokenBalance(tester.getAddress()),
            BigNumber.from(100).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        let blockNumBefore = await hre.ethers.provider.getBlockNumber();
        console.log("Block number :", blockNumBefore);

        // lockup 컨트랙트 출금
        await sleep(5000);
        const tester_signer = new NonceManager(new GasPriceManager(provider.getSigner(testerKey.address)));
        await lockup.connect(tester_signer).withdraw();

        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(10000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        assert.deepStrictEqual(
            await lockup.getLockedTokenBalance(tester.getAddress()),
            BigNumber.from(0).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );
    });
});

export function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}
