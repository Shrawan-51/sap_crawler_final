

# PriceDetailsSingleData

Price data of a single price condition.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**priceType** | [**PriceTypeEnum**](#PriceTypeEnum) |  |  [optional] |
|**amount** | [**MonetaryAmountWith6DecimalPlaces**](MonetaryAmountWith6DecimalPlaces.md) | The monetary price amount. |  |
|**baseQuantity** | [**Quantity**](Quantity.md) | The measured base quantity for which the price is determined. |  [optional] |
|**baseAmount** | [**MonetaryAmount**](MonetaryAmount.md) | The measured base monetary amount for which the price is determined. |  [optional] |
|**rateQuantity** | [**Quantity**](Quantity.md) | The quantity for which the price rate applies. |  [optional] |
|**rateAmount** | [**MonetaryAmountWith6DecimalPlaces**](MonetaryAmountWith6DecimalPlaces.md) | The monetary amount for which the price rate applies. |  [optional] |
|**priceRate** | [**MonetaryAmountWith6DecimalPlaces**](MonetaryAmountWith6DecimalPlaces.md) | The price for each rate quantity or monetary amount. |  |
|**multiplier** | **BigDecimal** | The factor that is multiplied with the reference price. |  |
|**referencePrice** | [**MonetaryAmountWith6DecimalPlaces**](MonetaryAmountWith6DecimalPlaces.md) | The reference price that is multiplied with the multiplier to get the monetary price amount. |  |



## Enum: PriceTypeEnum

| Name | Value |
|---- | -----|
| FIXED | &quot;Fixed&quot; |
| LINEAR | &quot;Linear&quot; |
| PERCENTAGE | &quot;Percentage&quot; |



