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
    return tokenAmountOut;
}

function calcInGivenOut(tokenBalanceIn, tokenWeightIn, tokenBalanceOut, tokenWeightOut, tokenAmountOut, swapFee) {
    const weightRatio = Decimal(tokenWeightOut).div(Decimal(tokenWeightIn));
    const diff = Decimal(tokenBalanceOut).minus(tokenAmountOut);
    const y = Decimal(tokenBalanceOut).div(diff);
    const foo = y.pow(weightRatio).minus(Decimal(1));
    const tokenAmountIn = (Decimal(tokenBalanceIn).times(foo)).div(Decimal(1).minus(Decimal(swapFee)));
    return tokenAmountIn;
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

// Reference: BMath.sol:calcPoolInGivenSingleOut
function calcPoolInGivenSingleOut(tokenBalanceOut, tokenWeightOut, poolSupply, totalWeight, tokenAmountOut, swapFee, exitFee) {
    const normalizedWeight = Decimal(tokenWeightOut).div(Decimal(totalWeight));
    const zoo = Decimal(1).sub(normalizedWeight);
    const zar = zoo.mul(Decimal(swapFee));
    const tokenAmountOutBeforeSwapFee = Decimal(tokenAmountOut).div(Decimal(1).sub(zar));

    const newTokenBalanceOut = Decimal(tokenBalanceOut).sub(tokenAmountOutBeforeSwapFee);
    const tokenOutRatio = newTokenBalanceOut.div(Decimal(tokenBalanceOut));

    const poolRatio = tokenOutRatio.pow(normalizedWeight);
    const newPoolSupply = poolRatio.mul(Decimal(poolSupply));
    const poolAmountInAfterExitFee = Decimal(poolSupply).sub(newPoolSupply);

    return poolAmountInAfterExitFee.div(Decimal(1).sub(Decimal(exitFee)));
}

function calcReserves(amountWithFee, amountWithoutFee) {
    const amountWithFeeDecimal = Decimal(amountWithFee);
    const amountWithoutFeeDecimal = Decimal(amountWithoutFee);
    return amountWithFeeDecimal.sub(amountWithoutFeeDecimal).div(2);
}

module.exports = {
    calcReserves,
    calcSpotPrice,
    calcOutGivenIn,
    calcInGivenOut,
    calcPoolOutGivenSingleIn,
    calcSingleInGivenPoolOut,
    calcRelativeDiff,
    calcPoolInGivenSingleOut,
};
