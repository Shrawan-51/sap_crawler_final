

# MassClosingRequestDetail

The processing details of a mass closing request.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** | The unique identifier of the mass closing request. |  |
|**createdAt** | **OffsetDateTime** | The point in time when the closing request was created. |  |
|**simulation** | **Boolean** | If &#x60;true&#x60;, the respective bills are not processed but are listed as a preview of bills that potentially would be processed with the given selection criteria. |  |
|**filter** | [**MassClosingRequestFilter**](MassClosingRequestFilter.md) |  |  |
|**processedBillsAtCount** | **Integer** | The total number of processed bills. |  [optional] |
|**processedBillsAtNextLink** | **String** | A link to the next page of processed bills if more than 40 processed bills are present. |  [optional] |
|**processedBills** | [**List&lt;MassClosingRequestProcessedBill&gt;**](MassClosingRequestProcessedBill.md) | A list of the bills that were processed with this request. Contains the first 40 processed bills only. If more than 40 processed bills are present, you can retrieve the bills with the endpoint &#x60;/bills/closing/{massClosingRequestId}/processedBills&#x60;. |  |



