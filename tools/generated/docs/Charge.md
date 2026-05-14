

# Charge


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**lineNumber** | **Integer** | The line number of the charge. A charge line number is unique per bill item. This property is only available for closed bills. |  [optional] |
|**metricId** | **String** |  |  |
|**measurementSpecification** | **Object** | The custom JSON for the measurement specification. |  [optional] |
|**subMetricId** | **String** | The unique identifier of the rate subelement. |  [optional] |
|**ratingType** | [**RatingTypeEnum**](#RatingTypeEnum) | The rating type of the charge. |  [optional] |
|**ratingPeriod** | [**RatingPeriod**](RatingPeriod.md) |  |  |
|**technicalResourceIds** | **List&lt;String&gt;** | IDs of technical resources |  [optional] |
|**externalObjectReferences** | [**List&lt;ChargeExternalObjectReferencesInner&gt;**](ChargeExternalObjectReferencesInner.md) | External object references inherited from specific subscription item attributes. |  [optional] |
|**consumedQuantity** | [**Quantity**](Quantity.md) | The usage for the rating period, as a quantity of units. |  |
|**chargedQuantity** | [**Quantity**](Quantity.md) | The usage quantity to be charged. This is usage that is not allocated to either an allowance or an included quantity defined in the rate plan. |  |
|**includedQuantity** | [**Quantity**](Quantity.md) | The quantity that is allocated either to an allowance or to an included quantity defined in the rate plan. This is determined by the &#x60;source&#x60; property (either &#x60;ALLOWANCE&#x60; or &#x60;RATE_PLAN_INCLUDED&#x60;). |  |
|**crossBillingCycleAggregation** | [**CrossBillingCycleAggregation**](CrossBillingCycleAggregation.md) |  |  [optional] |
|**netAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**grossAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**withReferenceToPricingScheme** | **Boolean** | Indicates whether the charge was calculated based on a pricing scheme, using the Price Calculation service. The value is derived from the product to which the charge applies. |  |
|**pricingElements** | [**List&lt;PricingElement&gt;**](PricingElement.md) |  |  [optional] |
|**reversal** | **Boolean** | Indicator that determines whether this charge reverses a previous charge. |  |
|**originalBillReference** | [**OriginalBillReference**](OriginalBillReference.md) |  |  [optional] |
|**usageRecordsAtNextLink** | **String** | A link allows you to retrieve all usage records if more than 100 records are included in this charge. |  [optional] |
|**usageRecordsAtCount** | **Integer** | The total number of usage records belonging to this charge. Note that it is displayed only when there are more than 100 usage records included in this charge. |  [optional] |
|**usageRecords** | [**List&lt;UsageRecord&gt;**](UsageRecord.md) | The usage records belonging to this charge, in case the respective expand option &#x60;usageRecords&#x60; was used. Note that a maximum of 100 usage records are contained in the collection. |  [optional] |
|**customAmounts** | [**List&lt;CustomAmount&gt;**](CustomAmount.md) |  |  [optional] |
|**subCharges** | [**List&lt;SubCharge&gt;**](SubCharge.md) |  |  [optional] |
|**includedQuantities** | [**List&lt;IncludedQuantity&gt;**](IncludedQuantity.md) |  |  |



## Enum: RatingTypeEnum

| Name | Value |
|---- | -----|
| RECURRING | &quot;recurring&quot; |
| ONETIME | &quot;onetime&quot; |
| USAGE | &quot;usage&quot; |



