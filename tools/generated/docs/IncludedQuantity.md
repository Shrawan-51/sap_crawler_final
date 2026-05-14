

# IncludedQuantity


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**name** | **String** | The descriptive name of the allowance. |  |
|**source** | [**SourceEnum**](#SourceEnum) | The type of included quantity. This can be an allowance or an included quantity defined in the rate plan. |  |
|**allocatedQuantity** | [**Quantity**](Quantity.md) |  |  |
|**allowanceDetails** | [**AllowanceDetails**](AllowanceDetails.md) |  |  [optional] |



## Enum: SourceEnum

| Name | Value |
|---- | -----|
| ALLOWANCE | &quot;ALLOWANCE&quot; |
| RATE_PLAN_INCLUDED | &quot;RATE_PLAN_INCLUDED&quot; |



