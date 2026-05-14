

# Credit


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**lineNumber** | **Integer** | The line number of the credit. A credit line number is unique per bill item. This property is only available for closed bills. |  [optional] |
|**metricId** | **String** |  |  |
|**ratingType** | [**RatingTypeEnum**](#RatingTypeEnum) | The rating type of the credit. |  [optional] |
|**ratingPeriod** | [**RatingPeriod**](RatingPeriod.md) |  |  |
|**consumedQuantity** | [**Quantity**](Quantity.md) |  |  |
|**creditedQuantity** | [**Quantity**](Quantity.md) |  |  [optional] |
|**includedQuantity** | [**Quantity**](Quantity.md) |  |  [optional] |
|**netAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**grossAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**pricingElements** | [**List&lt;PricingElement&gt;**](PricingElement.md) |  |  [optional] |
|**reversal** | **Boolean** | Indicator that determines whether this credit reverses a previous credit. |  |
|**usageRecordsAtNextLink** | **String** | A link allows you to retrieve all usage records if more than 100 records are included in this credit. |  [optional] |
|**usageRecordsAtCount** | **Integer** | The total number of usage records belonging to this credit. Note that it is displayed only when there are more than 100 usage records included in this credit. |  [optional] |
|**usageRecords** | [**List&lt;UsageRecord&gt;**](UsageRecord.md) |  |  [optional] |
|**customAmounts** | [**List&lt;CustomAmount&gt;**](CustomAmount.md) |  |  [optional] |
|**subCredits** | [**List&lt;SubCharge&gt;**](SubCharge.md) |  |  [optional] |
|**includedQuantities** | [**List&lt;IncludedQuantity&gt;**](IncludedQuantity.md) |  |  [optional] |



## Enum: RatingTypeEnum

| Name | Value |
|---- | -----|
| RECURRING | &quot;recurring&quot; |
| ONETIME | &quot;onetime&quot; |
| USAGE | &quot;usage&quot; |



