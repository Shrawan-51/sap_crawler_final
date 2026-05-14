

# PriceTierPercentage


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**upToQuantity** | [**QuantityUpperBound**](QuantityUpperBound.md) |  |  [optional] |
|**upToAmount** | [**MonetaryAmountUpperBound**](MonetaryAmountUpperBound.md) |  |  [optional] |
|**priceType** | [**PriceTypeEnum**](#PriceTypeEnum) |  |  [optional] |
|**multiplier** | **BigDecimal** | The factor that is multiplied with the reference price. |  |
|**referencePrice** | [**MonetaryAmountWith6DecimalPlaces**](MonetaryAmountWith6DecimalPlaces.md) | The reference price that is multiplied with the multiplier to get the monetary price amount. |  |
|**amount** | [**MonetaryAmountWith6DecimalPlaces**](MonetaryAmountWith6DecimalPlaces.md) | The monetary price amount. |  |



## Enum: PriceTypeEnum

| Name | Value |
|---- | -----|
| FIXED | &quot;Fixed&quot; |
| LINEAR | &quot;Linear&quot; |
| PERCENTAGE | &quot;Percentage&quot; |



