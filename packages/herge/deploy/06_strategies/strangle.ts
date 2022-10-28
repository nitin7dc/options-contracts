import { HardhatRuntimeEnvironment } from "hardhat/types"
import { parseUnits } from "ethers/lib/utils"
import limits_arbitrum from "./.limits.json"

async function deployment(hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deploy, get } = deployments
    const { deployer } = await getNamedAccounts()
    const ProfitCalculatorLib = await get("ProfitCalculator")

    const _params = {
        currency: "",
        scale: 0,
        default_limit: parseUnits("10000", 6),
        limits:{
            arbitrum: limits_arbitrum
        }[hre.network.name] as typeof limits_arbitrum,
    }

    async function deployOptionStrategy(params: typeof _params) {

        const priceProvider = await get("PriceProvider" + params.currency)
        const pricerName = `PriceCalculator_STRANGLE_${params.scale}_${params.currency}`
        const strategyName = `HegicStrategy_STRANGLE_${params.scale}_${params.currency}`
        const contract = "HegicStrategyStrangle"
        const spotDecimals = { ETH: 18, BTC: 8 }[params.currency]

        const putPricer = `PriceCalculator_PUT_${100 - params.scale}_${params.currency}`
        const callPricer = `PriceCalculator_CALL_${100 + params.scale}_${params.currency}`

        const pricers = [
            (await get(putPricer)).address,
            (await get(callPricer)).address,
        ]

        const pricer = await deploy(pricerName, {
            contract: "CombinePriceCalculator",
            from: deployer,
            log: true,
            args: [pricers, [1e5, 1e5]],
        })

        await deploy(strategyName, {
            contract,
            from: deployer,
            log: true,
            libraries: {
                ProfitCalculator: ProfitCalculatorLib.address
            },
            args: [
                priceProvider.address,
                pricer.address,
                params.limits?.[strategyName as keyof typeof limits_arbitrum] ?? params.default_limit,
                spotDecimals,
                params.scale * 100
            ]
        })
    }

    for (const scale of [10, 20, 30])
        for (const currency of ["ETH", "BTC"])
            await deployOptionStrategy({ ..._params, currency, scale })

}

deployment.tags = ["test", "strategies", "strategy-strangle", "arbitrum"]
deployment.dependencies = ["profit-calculator"]
export default deployment