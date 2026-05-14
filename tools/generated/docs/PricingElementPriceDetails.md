

# PricingElementPriceDetails

Details of how a price was calculated for the price element. Use the query parameter `expand` with the value `priceDetails` to include this attribute in the response.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**priceConditionType** | [**PriceConditionTypeEnum**](#PriceConditionTypeEnum) | The price condition type. |  |
|**proration** | [**Proration**](Proration.md) |  |  |
|**data** | [**PriceDetailsSingleData**](PriceDetailsSingleData.md) |  |  |
|**scale** | [**PriceDetailsVolumeScale**](PriceDetailsVolumeScale.md) |  |  |
|**tiers** | [**List&lt;PriceDetailsTierTiersInner&gt;**](PriceDetailsTierTiersInner.md) | The definition of the relevant tiers for tiered pricing. Depending on the base quantity or monetary amount, multiple tiers can be relevant for determining the total price for a price element. |  |



## Enum: PriceConditionTypeEnum

| Name | Value |
|---- | -----|
| SINGLE | &quot;Single&quot; |
| VOLUME | &quot;Volume&quot; |
| TIER | &quot;Tier&quot; |



