const Decimal = require('decimal.js');

function calcRelativeDiff(expected, actual) {
    return ((Decimal(expected).minus(Decimal(actual))).div(expected)).abs();
}

function calcSpotPrice(tokenBalanceIn, tokenWeightIn, tokenBalanceOut, tokenWeightOut, swapFee) {
    const numer = Decimal(tokenBalanceIn).div(Decimal(tokenWeightIn));
    const denom = Decimal(tokenBalanceOut).div(Decimal(tokenWeightOut));
    const ratio = numer.div(denom);
    const scale = Decimal(1).div(Decimal(1).sub(Decimal(swapFee)));
    const spotPrice = ratio.mul(scale);
    return spotPrice;
}

function calcOutGivenIn(tokenBalanceIn, tokenWeightIn, tokenBalanceOut, tokenWeightOut, tokenAmountIn, swapFee) {
    const weightRatio = Decimal(tokenWeightIn).div(Decimal(tokenWeightOut));
    const adjustedIn = Decimal(tokenAmountIn).times((Decimal(1).minus(Decimal(swapFee))));
    const y = Decimal(tokenBalanceIn).div(Decimal(tokenBalanceIn).plus(adjustedIn));
    const foo = y.pow(weightRatio);
    const bar = Decimal(1).minus(foo);
    const tokenAmountOut = Decimal(tokenBalanceOut).times(bar);
    const tokenInFee = Decimal.sub(tokenAmountIn, adjustedIn);
    return [tokenAmountOut, tokenInFee];
}

function calcInGivenOut(tokenBalanceIn, tokenWeightIn, tokenBalanceOut, tokenWeightOut, tokenAmountOut, swapFee) {
    const weightRatio = Decimal(tokenWeightOut).div(Decimal(tokenWeightIn));
    const diff = Decimal(tokenBalanceOut).minus(tokenAmountOut);
    const y = Decimal(tokenBalanceOut).div(diff);
    const foo = y.pow(weightRatio).minus(Decimal(1)).times(tokenBalanceIn);
    const tokenAmountIn = foo.div(Decimal(1).minus(Decimal(swapFee)));
    const tokenInFee = tokenAmountIn.sub(foo);
    return [tokenAmountIn, tokenInFee];
}

function calcPoolOutGivenSingleIn(tokenBalanceIn, tokenWeightIn, poolSupply, totalWeight, tokenAmountIn, swapFee) {
    const normalizedWeight = Decimal(tokenWeightIn).div(Decimal(totalWeight));
    const zaz = Decimal(1).sub(Decimal(normalizedWeight)).mul(Decimal(swapFee));
    const tokenAmountInAfterFee = Decimal(tokenAmountIn).mul(Decimal(1).sub(zaz));
    const newTokenBalanceIn = Decimal(tokenBalanceIn).add(tokenAmountInAfterFee);
    const tokenInRatio = newTokenBalanceIn.div(Decimal(tokenBalanceIn));
    const poolRatio = tokenInRatio.pow(normalizedWeight);
    const newPoolSupply = poolRatio.mul(Decimal(poolSupply));
    const poolAmountOut = newPoolSupply.sub(Decimal(poolSupply));
    return poolAmountOut;
}

function calcSingleInGivenPoolOut(tokenBalanceIn, tokenWeightIn, poolSupply, totalWeight, poolAmountOut, swapFee) {
    const normalizedWeight = Decimal(tokenWeightIn).div(Decimal(totalWeight));
    const newPoolSupply = Decimal(poolSupply).plus(Decimal(poolAmountOut));
    const poolRatio = newPoolSupply.div(Decimal(poolSupply));
    const boo = Decimal(1).div(normalizedWeight);
    const tokenInRatio = poolRatio.pow(boo);
    const newTokenBalanceIn = tokenInRatio.mul(Decimal(tokenBalanceIn));
    const tokenAmountInAfterFee = newTokenBalanceIn.sub(Decimal(tokenBalanceIn));
    const zar = (Decimal(1).sub(normalizedWeight)).mul(Decimal(swapFee));
    const tokenAmountIn = tokenAmountInAfterFee.div(Decimal(1).sub(zar));
    return tokenAmountIn;
}

// Reference: BMath.sol:calcSingleOutGivenPoolIn
function calcSingleOutGivenPoolIn(
    tokenBalanceOut,
    tokenWeightOut,
    poolSupply,
    totalWeight,
    poolAmountIn,
    swapFee,
    exitFee,
) {
    const normalizedWeight = Decimal(tokenWeightOut).div(Decimal(totalWeight));

    const poolAmountInAfterExitFee = Decimal(poolAmountIn).mul(Decimal(1).sub(Decimal(exitFee)));
    const newPoolSupply = Decimal(poolSupply).sub(poolAmountInAfterExitFee);
    const poolRatio = newPoolSupply.div(Decimal(poolSupply));

    const tokenOutRatio = poolRatio.pow(Decimal(1).div(normalizedWeight));
    const newTokenBalanceOut = tokenOutRatio.mul(Decimal(tokenBalanceOut));

    const tokenAmountOutBeforeSwapFee = Decimal(tokenBalanceOut).sub(newTokenBalanceOut);

    const zaz = (Decimal(1).sub(normalizedWeight)).mul(Decimal(swapFee));
    return tokenAmountOutBeforeSwapFee.mul(Decimal(1).sub(zaz));
}

function calcReserves(amountWithFee, amountWithoutFee, reservesRatio) {
    const amountWithFeeDecimal = Decimal(amountWithFee);
    const amountWithoutFeeDecimal = Decimal(amountWithoutFee);
    return amountWithFeeDecimal.sub(amountWithoutFeeDecimal).mul(reservesRatio);
}

function calcReservesFromFee(fee, reservesRatio) {
    return Decimal.mul(fee, reservesRatio);
}

module.exports = {
    calcReserves,
    calcSpotPrice,
    calcOutGivenIn,
    calcInGivenOut,
    calcPoolOutGivenSingleIn,
    calcSingleInGivenPoolOut,
    calcRelativeDiff,
    calcSingleOutGivenPoolIn,
    calcReservesFromFee,
};
