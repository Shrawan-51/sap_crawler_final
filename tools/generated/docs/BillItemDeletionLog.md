

# BillItemDeletionLog

A set of deleted bill items or bill items found for deletion.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**simulation** | **Boolean** | If &#x60;true&#x60;, the respective bill items are not deleted but are listed as a preview of items that potentially would be deleted with the given selection criteria. |  |
|**request** | [**BillItemDeletionLogRequest**](BillItemDeletionLogRequest.md) |  |  |
|**deletedItemsAtCount** | **Integer** | The total number deleted items. |  [optional] |
|**deletedItemsAtNextLink** | **String** | A link to the next page of deleted items, if more than 40 deleted items are present |  [optional] |
|**deletedItems** | [**List&lt;BillItemDeletionDeletedItem&gt;**](BillItemDeletionDeletedItem.md) | A list of the bill items that were deleted with this request. Contains the first 40 deleted items only. If more than 40 items are present, you can retrieve the items with the endpoint &#x60;/deletableBillItems/deletionLogs/{deletionLogId}/deletedItems&#x60;. |  |



