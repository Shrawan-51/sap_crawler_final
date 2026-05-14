

# Bill


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** | The unique identifier of the bill. |  |
|**documentNumber** | **Long** | The document number of the bill. The document number is unique per tenant and is assigned sequentially as bills are created. Note the following:   - There can be gaps in the sequence. For example, if a subscription is canceled and the associated bill is not closed, the bill is deleted along with its number.  - The sequence of bill numbers is not necessarily in chronological order of the billing periods. Bills are created when an event triggers rating, for example creation of or changes to a subscription, posting of usage data, or changes to rate plans. Bills are created in the sequence in which these events take place. |  |
|**metaData** | [**MetaData**](MetaData.md) |  |  |
|**billingType** | [**BillingTypeEnum**](#BillingTypeEnum) | Defines whether the bill contains charges or credits. Charges and credits are never on the same bill.  However, future changes to the API may introduce this possibility and indicate it via this property. |  |
|**market** | [**Market**](Market.md) |  |  |
|**timeZone** | **String** | The time zone of the subscription, as named in the IANA Time Zone Database. If it wasn&#39;t provided when creating the subscription, the time zone is set to the time zone of the market. This field overrides the time zone of the market if the values differ.  |  [optional] |
|**dueDate** | **LocalDate** | The date on which all charges or credits that will be included in the bill become due. On the due date the billing delay starts. |  [optional] |
|**billingDate** | **LocalDate** | The legal date of the bill, considering the time zone of the market. |  |
|**billingProfileId** | **String** | The identifier of the billing profile that was applied when the bill was created. |  [optional] |
|**billingPeriod** | [**BillingPeriod**](BillingPeriod.md) |  |  [optional] |
|**currency** | **String** | The ISO 4217 currency code of the bill document. All monetary amounts in the bill are specified in this currency. The currency of the bill may differ from the market currency if it is overwritten in the subscription. In this case, the currency is a split criterion even if the market is the same. &lt;br&gt;Note: Although the currency code applies to all monetary amounts of the bill, the currency code is provided for each monetary amount in the response for easier processing by the API consumer. |  [optional] |
|**billStatus** | [**BillStatusEnum**](#BillStatusEnum) | Status that indicates whether the bill is open for changes. The bill is open until the billing date is reached. The status &#x60;CLOSING&#x60; is an intermediate state indicating that final processing steps are taking place to close the bill. This should not take more than a few minutes. |  |
|**closing** | [**Closing**](Closing.md) |  |  [optional] |
|**transferStatus** | [**TransferStatusEnum**](#TransferStatusEnum) | Status that indicates whether the bill was transferred to a successor system. &lt;br&gt;&#x60;TRANSFERRED&#x60; shows that at least one successor document is assigned. Successor documents can be assigned and viewed using the &#x60;/bills/{identifier}/successorDocuments&#x60; resource.&lt;br&gt;&#x60;FAILED_PARTIALLY&#x60; shows that at least one successor document was created and at least one transfer attempt failed.&lt;br&gt;&#x60;FAILED&#x60; shows that no successor documents were created. |  |
|**successorDocuments** | [**List&lt;SuccessorDocument&gt;**](SuccessorDocument.md) | List of successor documents of this bill. Not included in the response by default. Use query parameter &#x60;$expand&#x60; with value &#x60;successorDocuments&#x60; to include this array in the response. |  [optional] |
|**splitElement** | **String** | An attribute that causes a separate bill to be created for a subscription. For example, if you provide the purchase order number as the bill split element, subscriptions for different purchase orders will be billed separately. |  [optional] |
|**contractAccount** | **String** | The contract account in SAP S/4HANA that is used to define payment methods, the dunning procedure, and tolerances, for example. The contract account is derived from the subscription if specified there. |  [optional] |
|**createInvoice** | **Boolean** | Indicator that determines if an invoice will be created for the bill. |  |
|**customer** | [**Customer**](Customer.md) |  |  |
|**payer** | [**Partner**](Partner.md) |  |  |
|**billTo** | [**Partner**](Partner.md) |  |  |
|**payment** | [**Payment**](Payment.md) |  |  |
|**netAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**grossAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**netCreditAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**grossCreditAmount** | [**MonetaryAmount**](MonetaryAmount.md) |  |  [optional] |
|**creditCard** | [**CreditCard**](CreditCard.md) | Not included in the response by default. Use query parameter &#x60;$expand&#x60; with value &#x60;creditCard&#x60; to include this structure in the response. |  [optional] |
|**customReferences** | [**List&lt;CustomReference&gt;**](CustomReference.md) | Custom references inherited from the customer. Not included in the response by default. Use query parameter &#x60;$expand&#x60; with value &#x60;customReferences&#x60; to include this array in the response. |  [optional] |
|**containsDeletableBillItems** | **Boolean** | If &#x60;true&#x60; the bill has items that are marked for deletion. |  |
|**billItems** | [**List&lt;BillItem&gt;**](BillItem.md) | A bill contains a maximum of 100 items. If there are more than 100 items, a new bill is created, which in turn contains up to 100 items. |  |
|**notificationSettings** | [**List&lt;NotificationSetting&gt;**](NotificationSetting.md) |  |  [optional] |
|**eventLog** | [**List&lt;EventLogEntry&gt;**](EventLogEntry.md) | The event log of the bill. |  [optional] |



## Enum: BillingTypeEnum

| Name | Value |
|---- | -----|
| CHARGE | &quot;CHARGE&quot; |
| CREDIT | &quot;CREDIT&quot; |



## Enum: BillStatusEnum

| Name | Value |
|---- | -----|
| OPEN | &quot;OPEN&quot; |
| CLOSING | &quot;CLOSING&quot; |
| CLOSED | &quot;CLOSED&quot; |



## Enum: TransferStatusEnum

| Name | Value |
|---- | -----|
| NOT_RELEVANT | &quot;NOT_RELEVANT&quot; |
| NOT_TRANSFERRED | &quot;NOT_TRANSFERRED&quot; |
| TRANSFER_IN_PROGRESS | &quot;TRANSFER_IN_PROGRESS&quot; |
| TRANSFERRED | &quot;TRANSFERRED&quot; |
| FAILED | &quot;FAILED&quot; |
| FAILED_PARTIALLY | &quot;FAILED_PARTIALLY&quot; |



