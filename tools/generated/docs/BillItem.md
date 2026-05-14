

# BillItem


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**lineNumber** | **Integer** | The line number of the bill item. A bill item line number is unique per bill. This property is only available for closed bills. |  [optional] |
|**type** | [**TypeEnum**](#TypeEnum) | Indicates whether the charges of this item originate from a subscription (&#x60;SUBSCRIPTION&#x60;) or from an allowance purchase (&#x60;ALLOWANCE&#x60;) |  [optional] |
|**subscription** | [**Subscription**](Subscription.md) |  |  |
|**allowance** | [**Allowance**](Allowance.md) |  |  [optional] |
|**product** | [**Product**](Product.md) |  |  |
|**ratePlan** | [**RatePlan**](RatePlan.md) |  |  |
|**groupingElement** | **String** |  |  [optional] |
|**netAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**grossAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**netCreditAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**grossCreditAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**customReferences** | [**List&lt;CustomReference&gt;**](CustomReference.md) | Custom references inherited from product, subscription and subscription item. See documentation for details on inheritance behavior. Not included in the response by default. Use query parameter &#x60;expand&#x60; with value &#x60;customReferences&#x60; to include this array in the response. |  [optional] |
|**externalObjectReferences** | [**List&lt;BillItemExternalObjectReferencesInner&gt;**](BillItemExternalObjectReferencesInner.md) | External object references inherited from subscription and subscription item. |  [optional] |
|**charges** | [**List&lt;Charge&gt;**](Charge.md) |  |  |
|**credits** | [**List&lt;Credit&gt;**](Credit.md) |  |  |
|**markedForDeletion** | **Boolean** | If &#x60;true&#x60; the corresponding subscription was deleted after the bill was closed. The item can be deleted in a subsequent step by using the &#x60;/deletableBillItems&#x60; endpoint. |  |
|**shipTo** | [**Partner**](Partner.md) |  |  |



## Enum: TypeEnum

| Name | Value |
|---- | -----|
| SUBSCRIPTION | &quot;SUBSCRIPTION&quot; |
| ALLOWANCE | &quot;ALLOWANCE&quot; |



