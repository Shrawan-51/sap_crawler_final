

# PricingElement

An element in pricing that contains attributes such as condition types and condition values. Pricing elements can be prices, surcharges, or discounts.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**step** | **BigDecimal** | The type of pricing element. |  [optional] |
|**priceElementSpecificationCode** | **String** | The type of pricing element. |  [optional] |
|**name** | **String** | The type of pricing element. |  [optional] |
|**statistical** | **Boolean** |  |  [optional] |
|**conditionType** | **String** | The type of pricing element. |  |
|**conditionValue** | [**MonetaryAmount**](MonetaryAmount.md) |  |  |
|**priceDetails** | [**PricingElementPriceDetails**](PricingElementPriceDetails.md) |  |  [optional] |



