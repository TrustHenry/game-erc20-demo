import { NonceManager } from "@ethersproject/experimental";
import * as assert from "assert";
import { solidity } from "ethereum-waffle";
import { BigNumber, Wallet } from "ethers";
import fs from "fs";
import * as hre from "hardhat";
import { Config } from "../src/service/common/Config";
import { GasPriceManager } from "../src/service/contract/GasPriceManager";
import { TestERC20 } from "../typechain-types";
import chai from "chai";

chai.use(solidity);
describe("Test of Server", function () {
    this.timeout(1000 * 60 * 5);
    const config = new Config();
    const ownerKey = new hre.ethers.Wallet(process.env.MANAGER_KEY || "");
    const minterKey = new hre.ethers.Wallet(process.env.MINTER_KEY || "");
    const provider = hre.ethers.provider;
    let owner = new NonceManager(new GasPriceManager(provider.getSigner(ownerKey.address)));
    const minter = new NonceManager(new GasPriceManager(provider.getSigner(minterKey.address)));
    let token: TestERC20;
    let token_address: string;
    const TEST_ERC20_ABI = JSON.parse(fs.readFileSync("src/service/contract/ERC20.ABI.json", "utf8"));

    before("Deploy Test Token", async () => {
        const ContractFactory = await hre.ethers.getContractFactory("TestERC20");
        const contract = (await ContractFactory.connect(owner).deploy("ColdNoodleToken", "CNT")) as TestERC20;
        await contract.deployed();
        token_address = contract.address;
        token = new hre.ethers.Contract(token_address, TEST_ERC20_ABI, hre.ethers.provider) as TestERC20;
    });

    it("Test the Token balance", async () => {
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(10000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );
    });

    it("Test the Token Mint", async () => {
        await token.connect(owner).grantRole(token.MINTER_ROLE(), minter.getAddress());
    });
});
