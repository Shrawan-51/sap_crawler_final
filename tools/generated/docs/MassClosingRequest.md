

# MassClosingRequest

A mass closing request.

## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** | The unique identifier of the mass closing request. |  |
|**createdAt** | **OffsetDateTime** | The point in time when the closing request was created. |  |
|**simulation** | **Boolean** | If &#x60;true&#x60;, the respective bills are not processed but are listed as a preview of bills that potentially would be processed with the given selection criteria. |  |
|**filter** | [**MassClosingRequestFilter**](MassClosingRequestFilter.md) |  |  |



