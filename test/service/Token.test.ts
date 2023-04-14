import { NonceManager } from "@ethersproject/experimental";
import * as assert from "assert";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber, Wallet } from "ethers";
import fs from "fs";
import * as hre from "hardhat";
import * as path from "path";
import { URL } from "url";
import { Config } from "../../src/service/common/Config";
import { GasPriceManager } from "../../src/service/contract/GasPriceManager";
import { TestERC20 } from "../../typechain-types";
import { TestClient, TestWalletServer } from "../Utility";

chai.use(solidity);

describe("Test of Server", function () {
    this.timeout(1000 * 60 * 5);
    const client = new TestClient();
    let wallet_server: TestWalletServer;
    let serverURL: URL;
    const config = new Config();
    const ownerKey = new hre.ethers.Wallet(process.env.MANAGER_KEY || "");
    const minterKey = new hre.ethers.Wallet(process.env.MINTER_KEY || "");
    const testerKey = new hre.ethers.Wallet(process.env.TESTER_KEY || "");
    const provider = hre.ethers.provider;
    let owner = new NonceManager(new GasPriceManager(provider.getSigner(ownerKey.address)));
    const minter = new NonceManager(new GasPriceManager(provider.getSigner(minterKey.address)));
    const tester = new NonceManager(new GasPriceManager(provider.getSigner(testerKey.address)));
    let token: TestERC20;
    let token_address: string;
    const initial_balance = BigNumber.from(100000000).mul(BigNumber.from(10).pow(18));
    const TEST_ERC20_ABI = JSON.parse(fs.readFileSync("src/service/contract/ERC20.ABI.json", "utf8"));

    before("Create TestServer", async () => {
        config.readFromFile(path.resolve(process.cwd(), "config", "config_test.yaml"));
        serverURL = new URL(`http://127.0.0.1:${config.server.port}`);
        wallet_server = new TestWalletServer(config);
    });

    before("Start TestServer", async () => {
        await wallet_server.start();
    });

    before("Deploy Test Token", async () => {
        const ContractFactory = await hre.ethers.getContractFactory("TestERC20");
        const contract = (await ContractFactory.connect(owner).deploy("Sample Token", "STK")) as TestERC20;
        await contract.deployed();
        token_address = contract.address;
        token = new hre.ethers.Contract(token_address, TEST_ERC20_ABI, hre.ethers.provider) as TestERC20;
    });

    it("Test the Token balance", async () => {
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(100000000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );
    });

    it("Test the Token Mint", async () => {
        // minter role 부여
        // await token.connect(owner).grantRole(token.MINTER_ROLE(), minter.address);
        await token.connect(owner).mint(BigNumber.from(2000).mul(BigNumber.from(10).pow(BigNumber.from(18))));
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(100002000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        await expect(
            token.connect(owner).mint(BigNumber.from(10000).mul(BigNumber.from(10).pow(BigNumber.from(18))))
        ).to.be.revertedWith("Daily mint limit exceeded");
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(100002000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        // it("should reset daily minted amount after 1 day", async () => {
        owner = new NonceManager(new GasPriceManager(provider.getSigner(ownerKey.address)));
        const amountToMint1 = BigNumber.from(4000).mul(BigNumber.from(10).pow(BigNumber.from(18))); // 1일 mint limit 내에서 mint
        const amountToMint2 = BigNumber.from(10000).mul(BigNumber.from(10).pow(BigNumber.from(18))); // 1일 mint limit 밖에서 mint

        // 1일 mint limit 내에서 mint
        await token.connect(owner).mint(amountToMint1);

        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(100006000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        // 1일 mint limit 초과하는 mint
        await expect(token.connect(owner).mint(amountToMint2)).to.be.revertedWith("Daily mint limit exceeded");

        owner = new NonceManager(new GasPriceManager(provider.getSigner(ownerKey.address)));

        // 1일 mint limit 까지만 mint
        await token.connect(owner).mint(amountToMint1);
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(100010000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        const DAY = 1000 * 60 * 60 * 24;
        // 다음 날 테스트를 위해 블록 타임스탬프를 1일 이후로 변경
        await hre.ethers.provider.send("evm_increaseTime", [DAY]);
        await hre.ethers.provider.send("evm_mine", []);

        // 1일 mint limit 내에서 mint
        await token.connect(owner).mint(amountToMint2);
        assert.deepStrictEqual(
            await token.balanceOf(owner.getAddress()),
            BigNumber.from(100020000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        // 2일째 mint limit 초과하는 mint
        await expect(token.connect(owner).mint(amountToMint1)).to.be.revertedWith("Daily mint limit exceeded");
        owner = new NonceManager(new GasPriceManager(provider.getSigner(ownerKey.address)));

        // 2일째 테스트를 위해 블록 타임스탬프를 1일 추가
        await hre.ethers.provider.send("evm_increaseTime", [DAY]);
        await hre.ethers.provider.send("evm_mine", []);
    });

    it("Test the Minter role", async () => {
        await token.connect(owner).grantRole(token.MINTER_ROLE(), minter.getAddress());
        await token.connect(minter).mint(BigNumber.from(2000).mul(BigNumber.from(10).pow(BigNumber.from(18))));
        assert.deepStrictEqual(
            await token.balanceOf(minter.getAddress()),
            BigNumber.from(2000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        await token.connect(owner).revokeRole(token.MINTER_ROLE(), minter.getAddress());
        await token.connect(owner).grantRole(token.MINTER_ROLE(), minter.getAddress());
        await token.connect(minter).mint(BigNumber.from(2000).mul(BigNumber.from(10).pow(BigNumber.from(18))));
        assert.deepStrictEqual(
            await token.balanceOf(minter.getAddress()),
            BigNumber.from(4000).mul(BigNumber.from(10).pow(BigNumber.from(18)))
        );

        await token.connect(owner).grantRole(token.MINTER_ROLE(), tester.getAddress());
        await token.connect(tester).mint(BigNumber.from(2000).mul(BigNumber.from(10).pow(BigNumber.from(18))));
    });
});
