/*
    Inquisition // Celestial // Config_table.js

    - Library representing the model for the listing tables located in the Tuning submodule
 */

"use strict";

var ConfigTable = function () {};

// Load Functs
ConfigTable.prototype.wrapItemHTML = function (dataType, itemHTML) {
    /*
        Return output of given item html wrapped in a generic item box container
     */

    return '' +
        '<div class="dataBlobContainer ' + dataType + 'Blob" data-datatype="' + dataType + '" data-identifier="0">' +
        '   <h3 class="heading listingHeader add">' + Global.normalizeTitle(dataType) + 's</h3>' +
        '   <div class="optSetListing">' +
        '       <div class="listingDataWrapper">' +
        '           <table class="listingData">' +
        itemHTML +
        '           </table>' +
        '       </div>' +
        '   </div>' +
        '</div>';
};

ConfigTable.prototype.generateItemButtonHTML = function (addEditButton, addDeleteButton) {
    /*
        Generate HTML for item action buttons
     */

    var buttonHTML = '<span class="listingOptButtons">';

    if(addEditButton)
    {
        buttonHTML += '<img class="edit" src="/static/imgs/icons/edit.svg" title="Edit Configuration" ' +
            'alt="Open modal to edit configuration">';
    }

    if(addDeleteButton)
    {
        buttonHTML += '<img class="delete" src="/static/imgs/icons/delete.svg" title="Delete Item" ' +
            'alt="Delete this item permanently">';
    }

    buttonHTML += '</span>';

    return buttonHTML;
};

ConfigTable.prototype.generateItemHTML = function (dataType, itemIdentifierFieldKey, itemFieldMetadata, itemData,
                                              requiredButtons, itemContentTitle) {
    /*
        Generate HTML of all given items using provided constraints
     */

    if(itemFieldMetadata == null || itemFieldMetadata == null || itemData == null)
    {
        throw 'missing item data provided during configuration item HTML generation';
    }

    var itemHTML = '',
        titleCaseDataType = Global.normalizeTitle(dataType);

    if(itemContentTitle != null)
    {
        titleCaseDataType = Global.normalizeTitle(itemContentTitle);
    }

    // generate html for table header first
    itemHTML += '<tr>';
    itemFieldMetadata.forEach(function (field) {
        itemHTML += '<th>' + field.name + '</th>';
    });
    itemHTML += '' +
        '   <th>OPTIONS</th>' +
        '</tr>';

    // table data
    itemData.forEach(function (item) {
        itemHTML += '<tr class="dataBlobWrapper" data-dataType="' + dataType + '" data-identifier="'
            + item[itemIdentifierFieldKey] + '">';

        // traverse each item and generate a cell for each data field
        itemFieldMetadata.forEach(function (itemField) {
            itemHTML += '<td>';
            switch (itemField.fieldType)
            {
                case 'general':
                    itemHTML += item[itemField.objKey];

                    break;
                case 'status':
                    var statusDisplayName = 'enabled',
                        statusHTMLChar = '&#10004;';

                    // '==' below is *not* a typo
                    if(item.status == false)
                    {
                        statusDisplayName = 'disabled';
                        statusHTMLChar = '&#10008;';
                    }

                    itemHTML += '<span class="' + statusDisplayName + '" title="' + titleCaseDataType + ' is '
                        + statusDisplayName.toUpperCase() + '">' + statusHTMLChar + '</span>';

                    break;
                case 'timestamp':
                    var timestamp = Global.prototype.convertTimestampToISO9601(item[itemField.objKey]);
                    itemHTML += '<time class="fuzzyTimestamp" title="' + timestamp + '" datetime="' + timestamp
                        + '">' + timestamp + '</time>';

                    break;
                case 'correlated':
                    // field value needs to be correlated w/ extra data
                    if(itemField.extraData.data == null)
                    {
                        throw 'no extra data provided for correlated item field';
                    }
                    var iocFieldName = 'UNKNOWN',
                        relatedData = itemField.extraData.data,
                        dataKey = itemField.extraData.sharedDataKey;

                    for(var i = 0; i < relatedData.length; i++)
                    {
                        if(relatedData[i][dataKey] === item[dataKey])
                        {
                            iocFieldName = relatedData[i][itemField.extraData.overwriteValKey];

                            break;
                        }
                    }

                    itemHTML += iocFieldName;

                    break;
                default:
                    throw 'unknown type found while generating item HTML :: [ ' + itemField.fieldType + ' ]';
            }
            itemHTML += '</td>';
        });

        // append button html
        itemHTML += '<td>' + ConfigTable.prototype.generateItemButtonHTML(requiredButtons.edit, requiredButtons.delete)
            + '</td>';

        itemHTML += '</tr>';
    });

    return this.wrapItemHTML(dataType, itemHTML);
};

ConfigTable.prototype.getConfigTableHTML = function (objDataType, rawObjDataset, addlDatasetForCorrelation) {
    /*
        Abstract function for generating config table HTML for given obj data type
     */

    var identifierFieldName = '',
        fieldOpts = [],
        actionButtonFlags = {};

    if(rawObjDataset == null)
    {
        throw 'no object dataset provided for object data HTML';
    }

    // generate item html based on datatype
    switch (objDataType)
    {
        case 'template':
            identifierFieldName = 'template_id';
            fieldOpts = [
                {
                    name: 'status',
                    fieldType: 'status',
                    isIdentifier: false,
                    objKey: 'status'
                },
                {
                    name: 'id',
                    fieldType: 'general',
                    isIdentifier: true,
                    objKey: 'template_id'
                },
                {
                    name: 'created',
                    fieldType: 'timestamp',
                    isIdentifier: false,
                    objKey: 'created'
                },
                {
                    name: 'name',
                    fieldType: 'general',
                    isIdentifier: false,
                    objKey: 'template_name'
                }
            ];
            actionButtonFlags = { edit: true, delete: true };

            break;
        case 'parser':
            identifierFieldName = 'parser_id';
            fieldOpts = [
                {
                    name: 'status',
                    fieldType: 'status',
                    isIdentifier: false,
                    objKey: 'status'
                },
                {
                    name: 'id',
                    fieldType: 'general',
                    isIdentifier: true,
                    objKey: 'parser_id'
                },
                {
                    name: 'created',
                    fieldType: 'timestamp',
                    isIdentifier: false,
                    objKey: 'created'
                },
                {
                    name: 'name',
                    fieldType: 'general',
                    isIdentifier: false,
                    objKey: 'parser_name'
                },
                {
                    name: 'log',
                    fieldType: 'general',
                    isIdentifier: false,
                    objKey: 'parser_log'
                }
            ];
            actionButtonFlags = { edit: true, delete: true };

            break;
        case 'known_host':
            identifierFieldName = 'host_id';
            fieldOpts = [
                {
                    name: 'id',
                    fieldType: 'general',
                    isIdentifier: true,
                    objKey: 'host_id'
                },
                {
                    name: 'created',
                    fieldType: 'timestamp',
                    isIdentifier: false,
                    objKey: 'created'
                },
                {
                    name: 'host',
                    fieldType: 'general',
                    isIdentifier: false,
                    objKey: 'host_val'
                }
            ];
            actionButtonFlags = { edit: false, delete: true };

            break;
        case 'ioc_field_mapping':
            identifierFieldName = 'mapping_id';
            fieldOpts = [
                {
                    name: 'id',
                    fieldType: 'general',
                    isIdentifier: true,
                    objKey: 'mapping_id'
                },
                {
                    name: 'ioc item name',
                    fieldType: 'general',
                    isIdentifier: false,
                    objKey: 'ioc_item_name'
                },
                {
                    name: 'mapped field name',
                    fieldType: 'correlated',
                    isIdentifier: false,
                    objKey: 'field_id',
                    extraData: {
                        data: addlDatasetForCorrelation,
                        sharedDataKey: 'field_id',
                        overwriteValKey: 'field_name'
                    }
                }
            ];
            actionButtonFlags = { edit: true, delete: true };

            break;
    }

    return ConfigTable.prototype.generateItemHTML(objDataType, identifierFieldName, fieldOpts, rawObjDataset,
        actionButtonFlags)
};

// Post-Load Functs
ConfigTable.prototype.deleteInquisitionDataObj = function (dataType, identifier) {
    /*
        Delete data object with given params using Inquisition API
     */

    // send api request via mystic lib
    Mystic.queryAPI('DELETE', '/api/v1/tuning/', 20000, {
        t: dataType,
        i: identifier
    }, function () {
        ErrorBot.generateError(-1, dataType + ' deleted successfully');
    }, function (apiResponse) {
        var apiError = '';
        if(apiResponse.error != null)
        {
            apiError = ' :: [ ' + apiResponse.error + ' ]';
        }

        ErrorBot.generateError(4, 'could not delete ' + dataType + ' via Inquisition API' + apiError);
    });
};

ConfigTable.prototype.itemButtonHandler = function (itemElmnt, modalType, action, modalOpts, modalObj) {
    /*
        Handler for when an item's action buttons are acted upon (clicked) by the user
     */

    // get metadata of item
    var entryContainer = itemElmnt.parents('.dataBlobWrapper'),
        dataType = itemElmnt.parents('.dataBlobContainer').data('datatype'),
        objIdentifier = entryContainer.data('identifier');

    // set opts based on action
    if(modalOpts == null)
    {
        // modal opts are not being overridden; set default based on action
        switch (action)
        {
            case 'delete':
                modalOpts = {
                    message: 'Are you sure you want to delete this ' + dataType.replace(/_/g, ' ') + '?',
                    callback: function (result) {
                        if(result)
                        {
                            // delete via api and remove from view
                            ConfigTable.prototype.deleteInquisitionDataObj(dataType, objIdentifier);
                            entryContainer.fadeOut();
                        }
                    }
                };

                break;
            case 'edit':
            case 'add':
                var modalContent = '' +
                    '<div class="modalContentWrapper" data-datatype="' + dataType + '">' +
                    '   <div class="heading modalHeader">' + action + ' ' + dataType.replace(/_/g, ' ') + '</div>';

                if(action === 'add')
                {
                    modalContent += '' +
                        '<div class="modalActionButtonWrapper">' +
                        '   <div class="modalButton blockCenter clear">&#10008; Clear</div>' +
                        '   <div class="modalButton blockCenter save">&#10004; Save</div>' +
                        '</div>';
                }

                modalContent += ''
                    + '   <div class="modalContent objContent ' + dataType + 'Modal" data-identifier="' + objIdentifier
                    + '" data-action="' + action + '">'
                    + View.initLoadingModal(null, 'small', true)
                    + '   </div>'
                    + '</div>';

                modalOpts = {
                    contentClassName: 'lgTuningModal',
                    unsafeContent: modalContent
                };

                break;
            default:
                throw 'invalid action provided to item button handler';
        }
    }

    if(modalObj == null)
    {
        modalObj = new Modal(dataType, objIdentifier, modalOpts, modalType, action);
    }

    // init modal
    modalObj.initModal(action);
};

ConfigTable.prototype.initConfigItemHandlers = function () {
    /*
        Initialize the handlers for all config table items
     */

    var actionSet = [
        { action: 'delete', modalType: 'confirmation' },
        { action: 'edit', modalType: 'general' },
        { action: 'add', modalType: 'general' }
    ];

    // set handlers for all modals for CRUD
    // NOTE: we're using off() here in order to remove any preexisting event handlers as this function can be ran
    // multiple times, causing multiple listeners doing the same thing
    $.each(actionSet, function (idx, actionSetDataset) {
        var actionSpecificElmntSelector = $('.' + actionSetDataset.action);

        actionSpecificElmntSelector.off().click(function () {
            ConfigTable.prototype.itemButtonHandler($(this), actionSetDataset.modalType, actionSetDataset.action);
        });

        if(actionSetDataset.action === 'add')
        {
            // add hover function for view
            actionSpecificElmntSelector.hover(function () {
                var origAddButtonText = $(this).text();

                // save to element for use in leave function below
                $(this).data('orig-text', origAddButtonText);

                $(this).html('<p class="accent">+</p> Add ' + origAddButtonText);
            }, function () {
                $(this).html($(this).data('orig-text'));
            });
        }
    });
};
