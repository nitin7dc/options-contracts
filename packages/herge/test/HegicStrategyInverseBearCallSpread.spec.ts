import {expect} from "chai"
import {fixture, Fixture} from "./utils/fixtures"
import {parseUnits, keccak256, toUtf8Bytes, formatUnits} from "ethers/lib/utils"
import {constants, BigNumberish, ethers, BigNumber} from "ethers"
import {getInverseCallPayOff} from "./utils/helper"
import {initializePools} from "./utils/contracts"

const OPERATIONAL_TRESUARY_ROLE = keccak256(
  toUtf8Bytes("OPERATIONAL_TRESUARY_ROLE"),
)

describe("HegicStrategyInverseBearCallSpread.spec", () => {
  let testData: Fixture

  const show = async (testData: Fixture) =>
    console.log(
      (await testData.OperationalTreasury.totalBalance()).toNumber() / 1e6,
      (await testData.OperationalTreasury.lockedPremium()).toNumber() / 1e6,
      (await testData.OperationalTreasury.totalLocked()).toNumber() / 1e6,
    )

  beforeEach(async () => {
    testData = await fixture()
    await initializePools(testData)
  })

  describe("Should correct exercise and revert Bear-Call-Spread-10% option", () => {
    describe("ETH", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellAtmStrike
        await PriceProviderETH.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price more than ATM Strike and less than OTM Strike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("1051", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getInverseCallPayOff = getInverseCallPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "ETH",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInverseCallPayOff)
      })

      it("exercise price = buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmStrike
        await PriceProviderETH.setPrice(exericsePrice)

        const _getInverseCallPayOff = getInverseCallPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInverseCallPayOff)
      })

      it("exercise price > buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("1100", 8) //strike which the user buys (hedge)

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("2000", 8)
        await PriceProviderETH.setPrice(exericsePrice)

        const _getInverseCallPayOff = getInverseCallPayOff(
          buyOtmStrike,
          buyOtmStrike,
          amount,
          "ETH",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInverseCallPayOff)
      })

      it("should revert transcation when exercise price < sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderETH,
        } = testData

        const amount = parseUnits("1")
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

        await PriceProviderETH.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_ETH.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("10", 8)
        await PriceProviderETH.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })
    })

    describe("BTC", () => {
      it("should revert transcation when exercise price = sellAtmStrike [1]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = sellAtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("Invalid strike = Current price")
      })

      it("exercise price = buyOtmStrike [2]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("22000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = buyOtmStrike
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getInverseCallPayOff = getInverseCallPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "BTC",
        )

        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInverseCallPayOff)
      })

      it("exercise price > buyOtmStrike [3]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("20000", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("22000", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("40000", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getInverseCallPayOff = getInverseCallPayOff(
          buyOtmStrike,
          buyOtmStrike,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInverseCallPayOff)
      })

      it("exercise price more than sellAtmStrike and less than buyOtmStrike [4]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("18923", 8) //strike which the user sells
        let buyOtmStrike = parseUnits("20815.3", 8) //strike which the user buys (hedge)

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("19500", 8)
        await PriceProviderBTC.setPrice(exericsePrice)

        const _getInverseCallPayOff = getInverseCallPayOff(
          buyOtmStrike,
          exericsePrice,
          amount,
          "BTC",
        )
        await expect(() =>
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).changeTokenBalance(USDC, alice, _getInverseCallPayOff)
      })

      it.skip("should revert transcation when exercise price < sellAtmStrike [5]", async () => {
        const {
          OperationalTreasury,
          signers: [deployer, alice, bob, carl],
          USDC,
          strategies,
          PriceProviderBTC,
        } = testData

        const amount = parseUnits("1", 8)
        const period = 86400 * 7
        let sellAtmStrike = parseUnits("1000", 8) //strike which the user sells

        await PriceProviderBTC.setPrice(sellAtmStrike)
        await OperationalTreasury.connect(alice).buy(
          strategies.HegicStrategy_INVERSE_BEAR_CALL_SPREAD_10_BTC.address,
          alice.address,
          amount,
          period,
          [],
        )
        const exericsePrice = parseUnits("10", 8)
        await PriceProviderBTC.setPrice(exericsePrice)
        await expect(
          OperationalTreasury.connect(deployer).payOff(0, alice.address),
        ).to.be.revertedWith("You can not execute this option strat")
      })
    })
  })
})