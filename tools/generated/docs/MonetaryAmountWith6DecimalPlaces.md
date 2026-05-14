

# MonetaryAmountWith6DecimalPlaces

Schema defining monetary amount in given currency.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**amount** | **BigDecimal** | The amount in the specified currency. Given with all six decimal places, rounding half up. The number of decimal places can be more than the default number defined by the international standards for the specified currency. |  |
|**currency** | **String** | ISO 4217 currency code, for example USD, EUR, CHF |  |



