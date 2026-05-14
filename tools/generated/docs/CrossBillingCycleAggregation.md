

# CrossBillingCycleAggregation

Provides the cumulative charged quantity for the aggregation period relevant for the charge. This information is available for usage charges with the rating variant Aggregated and for which cross-billing cycle aggregation has been activated in the rate plan template.  The start of the aggregation period depends on the aggregation cycle setting in the rate plan template. The end of the aggregation period is equal to the end of the rating period for the charge.  For example, consider a subscription starting on January 1st with billing cycle Calendar Monthly and a usage charge with aggregation cycle Quarterly: - If usage is posted in January, the bill for January will contain a charge with aggregation period January 1st to January 31st. The aggregation period start is equal to the subscription start and the aggregation period end is equal to the rating period end for the charge. The aggregated quantity is equal to the charged quantity in January. - If usage is posted in February, the bill for February will contain a charge with aggregation period January 1st to February 28th/29th. The aggregation period start is still equal to the subscription start, because the charge is still within the first quarter and therefore within the aggregation cycle. The aggregation period end is equal to the rating period end for the charge. The aggregated quantity is equal to the sum of the charged quantity in January and February. - If usage is posted in April, the bill for April will contain a charge with aggregation period April 1st to April 30th. The aggregation period start is now equal to the start of the second quarter according to the aggregation cycle Quarterly. The aggregation period end is equal to the rating period end for the charge. The aggregated quantity is equal to the charged quantity in April.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**aggregationPeriod** | [**AggregationPeriod**](AggregationPeriod.md) |  |  |
|**quantity** | [**Quantity**](Quantity.md) | The sum of all quantities charged for the subscription within the aggregation period. |  |



