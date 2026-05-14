

# BillingSettingsThatAreAppliedToTheBillAndFixedForTheBillingPeriod


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**billingDateDelay** | **BigDecimal** | The number of days by which the billing date is delayed. The billing delay allows time for certain changes to be reflected in bills before they&#39;re closed and transferred to invoicing. Bills are kept open by the length of the delay when they reach their due date. |  [optional] |
|**adjustmentCycle** | [**AdjustmentCycleEnum**](#AdjustmentCycleEnum) | The timing of billing for adjustments to charges. Only applies to recurring charges that are billed in advance. Adjustments can result from changes in the subscription, changes to prices, or retroactive subscription changes, such as a change of the rate plan for a past billing cycle. &lt;br&gt;If you have a long billing cycle, by specifying a shorter adjustment period you can bill adjusted charges closer to the time in which the adjustment occurs. |  [optional] |
|**billingOfBackdatedSubscriptions** | [**BillingOfBackdatedSubscriptionsEnum**](#BillingOfBackdatedSubscriptionsEnum) | The timing of billing for backdated subscriptions. Applies to charges or credits of a subscription that are already overdue when the subscription is created. Available options are billing on the day after creation or within the time frame selected for the &#x60;adjustmentCycle&#x60;. |  [optional] |



## Enum: AdjustmentCycleEnum

| Name | Value |
|---- | -----|
| MATCHES_BILLING_CYCLE | &quot;MATCHES-BILLING-CYCLE&quot; |
| DAILY | &quot;DAILY&quot; |
| MONTHLY | &quot;MONTHLY&quot; |
| QUARTERLY | &quot;QUARTERLY&quot; |
| HALF_YEARLY | &quot;HALF-YEARLY&quot; |
| YEARLY | &quot;YEARLY&quot; |
| IMMEDIATE | &quot;IMMEDIATE&quot; |



## Enum: BillingOfBackdatedSubscriptionsEnum

| Name | Value |
|---- | -----|
| MATCHES_ADJUSTMENT_PERIOD | &quot;MATCHES-ADJUSTMENT-PERIOD&quot; |
| DAY_AFTER_CREATION | &quot;DAY-AFTER-CREATION&quot; |



